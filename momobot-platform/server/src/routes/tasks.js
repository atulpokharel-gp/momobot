const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');
const { connectedAgents } = require('../websocket/agentSocket');

const router = express.Router();

const VALID_TASK_TYPES = ['shell', 'script', 'file_read', 'file_write', 'system_info', 'screenshot', 'process_list', 'custom'];

// GET /api/tasks - List tasks
router.get('/', (req, res) => {
  const db = getDB();
  const { agent_id, status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT t.*, a.name as agent_name, u.username as created_by_name
    FROM tasks t
    JOIN agents a ON t.agent_id = a.id
    JOIN users u ON t.created_by = u.id
    WHERE (a.owner_id = ? OR ? = 'admin')
  `;
  const params = [req.user.id, req.user.role];

  if (agent_id) { query += ' AND t.agent_id = ?'; params.push(agent_id); }
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const tasks = db.prepare(query).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t
    JOIN agents a ON t.agent_id = a.id
    WHERE (a.owner_id = ? OR ? = 'admin')
    ${agent_id ? 'AND t.agent_id = ?' : ''}
    ${status ? 'AND t.status = ?' : ''}
  `).get(...params.slice(0, params.length - 2));

  res.json({ tasks, total: total.count });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const db = getDB();
  const task = db.prepare(`
    SELECT t.*, a.name as agent_name
    FROM tasks t JOIN agents a ON t.agent_id = a.id
    WHERE t.id = ? AND (a.owner_id = ? OR ? = 'admin')
  `).get(req.params.id, req.user.id, req.user.role);

  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: { ...task, args: JSON.parse(task.args || '{}') } });
});

// POST /api/tasks - Create and dispatch a task
router.post('/',
  body('agent_id').notEmpty().isString(),
  body('type').isIn(VALID_TASK_TYPES),
  body('command').isLength({ min: 1, max: 2048 }).trim(),
  body('args').optional().isObject(),
  body('priority').optional().isInt({ min: 1, max: 10 }),
  body('timeout').optional().isInt({ min: 1000, max: 300000 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { agent_id, type, command, args = {}, priority = 5, timeout = 30000 } = req.body;
    const db = getDB();

    // Verify agent ownership
    const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND (owner_id = ? OR ? = \'admin\') AND is_active = 1')
      .get(agent_id, req.user.id, req.user.role);
    if (!agent) return res.status(404).json({ error: 'Agent not found or not authorized' });

    const taskId = uuidv4();
    db.prepare(`
      INSERT INTO tasks (id, agent_id, created_by, type, command, args, status, priority, timeout)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(taskId, agent_id, req.user.id, type, command, JSON.stringify(args), priority, timeout);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    // Try to dispatch immediately if agent is connected
    const agentSocket = connectedAgents.get(agent_id);
    if (agentSocket) {
      agentSocket.emit('task', {
        id: taskId,
        type,
        command,
        args,
        priority,
        timeout
      });
      db.prepare('UPDATE tasks SET status = \'dispatched\' WHERE id = ?').run(taskId);
      task.status = 'dispatched';
    }

    // Notify dashboard clients
    const io = req.app.get('io');
    if (io) {
      io.of('/client').emit('task:created', { task: { ...task, agent_name: agent.name } });
    }

    res.status(201).json({
      task: { ...task, dispatched: !!agentSocket },
      message: agentSocket ? 'Task dispatched to agent' : 'Task queued (agent offline)'
    });
  }
);

// DELETE /api/tasks/:id - Cancel a pending task
router.delete('/:id', (req, res) => {
  const db = getDB();
  const task = db.prepare(`
    SELECT t.* FROM tasks t JOIN agents a ON t.agent_id = a.id
    WHERE t.id = ? AND (a.owner_id = ? OR ? = 'admin') AND t.status IN ('pending', 'dispatched')
  `).get(req.params.id, req.user.id, req.user.role);

  if (!task) return res.status(404).json({ error: 'Task not found or cannot be cancelled' });

  db.prepare('UPDATE tasks SET status = \'cancelled\', updated_at = datetime(\'now\') WHERE id = ?').run(req.params.id);

  // Try to notify the agent
  const agentSocket = connectedAgents.get(task.agent_id);
  if (agentSocket) {
    agentSocket.emit('task:cancel', { taskId: req.params.id });
  }

  res.json({ message: 'Task cancelled' });
});

module.exports = router;
