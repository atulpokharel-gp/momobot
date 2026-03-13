const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const db = getDB();
    const user = db.prepare('SELECT id, email, username, role, is_active FROM users WHERE id = ?').get(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const db = getDB();
  const user = db.prepare('SELECT id, email, username, role, is_active FROM users WHERE api_key = ?').get(apiKey);

  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.user = user;
  next();
}

module.exports = { authenticate, requireRole, authenticateApiKey };
