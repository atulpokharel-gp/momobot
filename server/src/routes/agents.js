const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/agents - List all agents for current user (admin sees all)
router.get('/', (req, res) => {
  const db = getDB();
  let agents;
  if (req.user.role === 'admin') {
    agents = db.prepare(`
      SELECT a.*, u.username as owner_name, u.email as owner_email
      FROM agents a
      JOIN users u ON a.owner_id = u.id
      ORDER BY a.created_at DESC
    `).all();
  } else {
    agents = db.prepare(`
      SELECT a.*, u.username as owner_name
      FROM agents a
      JOIN users u ON a.owner_id = u.id
      WHERE a.owner_id = ?
      ORDER BY a.created_at DESC
    `).all(req.user.id);
  }

  // Parse JSON fields
  agents = agents.map(a => ({
    ...a,
    capabilities: JSON.parse(a.capabilities || '[]'),
    os_info: a.os_info ? JSON.parse(a.os_info) : null,
    secret_key: undefined // Never expose secret key
  }));

  res.json({ agents });
});

// GET /api/agents/:id - Get single agent details
router.get('/:id', (req, res) => {
  const db = getDB();
  const agent = db.prepare(`
    SELECT a.*, u.username as owner_name
    FROM agents a
    JOIN users u ON a.owner_id = u.id
    WHERE a.id = ? AND (a.owner_id = ? OR ? = 'admin')
  `).get(req.params.id, req.user.id, req.user.role);

  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  // Recent tasks
  const tasks = db.prepare(`
    SELECT id, type, command, status, created_at, completed_at
    FROM tasks WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.params.id);

  // Recent logs
  const logs = db.prepare(`
    SELECT * FROM agent_logs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.params.id);

  res.json({
    agent: {
      ...agent,
      capabilities: JSON.parse(agent.capabilities || '[]'),
      os_info: agent.os_info ? JSON.parse(agent.os_info) : null,
      secret_key: undefined
    },
    tasks,
    logs
  });
});

// POST /api/agents - Create new agent registration
router.post('/',
  body('name').isLength({ min: 1, max: 64 }).trim().escape(),
  body('description').optional().isLength({ max: 256 }).trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const db = getDB();

    const agentId = uuidv4();
    const apiKey = 'bot_' + crypto.randomBytes(24).toString('hex');
    const secretKey = crypto.randomBytes(32).toString('hex');

    db.prepare(`
      INSERT INTO agents (id, name, description, owner_id, api_key, secret_key)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agentId, name, description || '', req.user.id, apiKey, secretKey);

    res.status(201).json({
      message: 'Agent created. Install MomoBot on your local machine using these credentials.',
      agent: {
        id: agentId,
        name,
        description,
        apiKey,
        secretKey, // Shown ONCE at creation
        serverUrl: `ws://${req.hostname}:${process.env.PORT || 4000}/agents`
      }
    });
  }
);

// PATCH /api/agents/:id - Update agent
router.patch('/:id',
  body('name').optional().isLength({ min: 1, max: 64 }).trim().escape(),
  body('description').optional().isLength({ max: 256 }).trim().escape(),
  (req, res) => {
    const db = getDB();
    const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND (owner_id = ? OR ? = \'admin\')').get(req.params.id, req.user.id, req.user.role);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { name, description } = req.body;
    if (name) db.prepare('UPDATE agents SET name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, req.params.id);
    if (description !== undefined) db.prepare('UPDATE agents SET description = ?, updated_at = datetime(\'now\') WHERE id = ?').run(description, req.params.id);

    res.json({ message: 'Agent updated' });
  }
);

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', (req, res) => {
  const db = getDB();
  const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND (owner_id = ? OR ? = \'admin\')').get(req.params.id, req.user.id, req.user.role);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id);
  res.json({ message: 'Agent deleted' });
});

// POST /api/agents/:id/regenerate-key - Regenerate API key
router.post('/:id/regenerate-key', (req, res) => {
  const db = getDB();
  const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND (owner_id = ? OR ? = \'admin\')').get(req.params.id, req.user.id, req.user.role);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const newApiKey = 'bot_' + crypto.randomBytes(24).toString('hex');
  const newSecretKey = crypto.randomBytes(32).toString('hex');

  db.prepare('UPDATE agents SET api_key = ?, secret_key = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newApiKey, newSecretKey, req.params.id);

  res.json({ apiKey: newApiKey, secretKey: newSecretKey, message: 'Credentials regenerated. Update your MomoBot config.' });
});

module.exports = router;
