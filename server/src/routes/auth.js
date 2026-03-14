const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate tokens
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 32 }).trim().escape(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password } = req.body;
      const db = getDB();

      // Check duplicates
      const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
      if (existing) {
        return res.status(409).json({ error: 'Email or username already exists' });
      }

      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      const userId = uuidv4();
      const apiKey = 'mk_' + uuidv4().replace(/-/g, '');

      db.prepare(`
        INSERT INTO users (id, email, username, password_hash, api_key)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, email, username, hash, apiKey);

      const { accessToken, refreshToken } = generateTokens(userId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, refreshToken, req.ip, req.headers['user-agent'] || '', expiresAt);

      db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(userId);

      res.status(201).json({
        message: 'Account created successfully',
        accessToken,
        refreshToken,
        user: { id: userId, email, username, role: 'user' }
      });
    } catch (err) {
      console.error('[AUTH] Register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, totpCode } = req.body;
      const db = getDB();

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 2FA check
      if (user.totp_enabled) {
        if (!totpCode) {
          return res.status(200).json({ requiresTOTP: true, message: '2FA code required' });
        }
        const verified = speakeasy.totp.verify({
          secret: user.totp_secret,
          encoding: 'base32',
          token: totpCode,
          window: 2
        });
        if (!verified) {
          return res.status(401).json({ error: 'Invalid 2FA code' });
        }
      }

      const { accessToken, refreshToken } = generateTokens(user.id);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Clean old sessions for this user (keep last 5)
      const oldSessions = db.prepare('SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 4').all(user.id);
      if (oldSessions.length) {
        const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
        oldSessions.forEach(s => stmt.run(s.id));
      }

      db.prepare(`
        INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), user.id, refreshToken, req.ip, req.headers['user-agent'] || '', expiresAt);

      db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

      res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, totpEnabled: !!user.totp_enabled }
      });
    } catch (err) {
      console.error('[AUTH] Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = getDB();

    const session = db.prepare('SELECT * FROM sessions WHERE refresh_token = ? AND user_id = ?').get(refreshToken, decoded.userId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (new Date(session.expires_at) < new Date()) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare('UPDATE sessions SET refresh_token = ?, expires_at = ? WHERE id = ?')
      .run(newRefreshToken, expiresAt, session.id);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  try {
    const { refreshToken } = req.body;
    const db = getDB();
    if (refreshToken) {
      db.prepare('DELETE FROM sessions WHERE refresh_token = ?').run(refreshToken);
    } else {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, email, username, role, totp_enabled, api_key, last_login, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

// POST /api/auth/2fa/setup
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `MomoBot (${req.user.email})`,
      length: 32
    });

    const db = getDB();
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret.base32, req.user.id);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrCodeUrl });
  } catch (err) {
    res.status(500).json({ error: '2FA setup failed' });
  }
});

// POST /api/auth/2fa/verify
router.post('/2fa/verify', authenticate,
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDB();
    const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.user.id);

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: req.body.token,
      window: 2
    });

    if (!verified) return res.status(400).json({ error: 'Invalid 2FA code' });

    db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(req.user.id);
    res.json({ message: '2FA enabled successfully' });
  }
);

// POST /api/auth/2fa/disable
router.post('/2fa/disable', authenticate,
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDB();
    const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.user.id);

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: req.body.token,
      window: 2
    });

    if (!verified) return res.status(400).json({ error: 'Invalid 2FA code' });

    db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(req.user.id);
    res.json({ message: '2FA disabled' });
  }
);

// POST /api/auth/regenerate-api-key
router.post('/regenerate-api-key', authenticate, (req, res) => {
  const newKey = 'mk_' + uuidv4().replace(/-/g, '');
  const db = getDB();
  db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(newKey, req.user.id);
  res.json({ apiKey: newKey });
});

module.exports = router;
