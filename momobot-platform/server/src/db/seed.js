const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('./database');

async function seedAdmin() {
  const db = getDB();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@momobot.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) {
    console.log('[SEED] Admin user already exists');
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(adminPassword, salt);
  const apiKey = 'mk_admin_' + uuidv4().replace(/-/g, '');

  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, role, api_key)
    VALUES (?, ?, ?, ?, 'admin', ?)
  `).run(uuidv4(), adminEmail, 'admin', hash, apiKey);

  console.log('[SEED] Admin user created:', adminEmail);
}

module.exports = { seedAdmin };
