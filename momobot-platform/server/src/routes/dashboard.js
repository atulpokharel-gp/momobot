const express = require('express');
const { getDB } = require('../db/database');
const { connectedAgents } = require('../websocket/agentSocket');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const db = getDB();
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.id;

  const agentFilter = isAdmin ? '' : 'WHERE owner_id = ?';
  const agentParams = isAdmin ? [] : [userId];

  const totalAgents = db.prepare(`SELECT COUNT(*) as count FROM agents ${agentFilter}`).get(...agentParams);

  const onlineAgents = isAdmin
    ? db.prepare('SELECT COUNT(*) as count FROM agents WHERE status = \'online\'').get()
    : db.prepare('SELECT COUNT(*) as count FROM agents WHERE status = \'online\' AND owner_id = ?').get(userId);

  const taskFilter = isAdmin
    ? 'WHERE 1=1'
    : 'JOIN agents a ON t.agent_id = a.id WHERE a.owner_id = ?';

  const pendingTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks t ${taskFilter} AND t.status IN ('pending','dispatched')`).get(...(isAdmin ? [] : [userId]));
  const runningTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks t ${taskFilter} AND t.status = 'running'`).get(...(isAdmin ? [] : [userId]));
  const completedToday = db.prepare(`SELECT COUNT(*) as count FROM tasks t ${taskFilter} AND t.status = 'completed' AND date(t.completed_at) = date('now')`).get(...(isAdmin ? [] : [userId]));
  const failedToday = db.prepare(`SELECT COUNT(*) as count FROM tasks t ${taskFilter} AND t.status = 'failed' AND date(t.completed_at) = date('now')`).get(...(isAdmin ? [] : [userId]));

  // Live connected agent count from WebSocket registry
  const liveCount = connectedAgents.size;

  // Recent activity
  const recentTasks = db.prepare(`
    SELECT t.id, t.command, t.status, t.type, t.created_at, a.name as agent_name
    FROM tasks t JOIN agents a ON t.agent_id = a.id
    ${isAdmin ? '' : 'WHERE a.owner_id = ?'}
    ORDER BY t.created_at DESC LIMIT 10
  `).all(...(isAdmin ? [] : [userId]));

  res.json({
    stats: {
      totalAgents: totalAgents.count,
      onlineAgents: onlineAgents.count,
      liveConnections: liveCount,
      pendingTasks: pendingTasks.count,
      runningTasks: runningTasks.count,
      completedToday: completedToday.count,
      failedToday: failedToday.count
    },
    recentTasks
  });
});

// GET /api/dashboard/agents/status - Live agent statuses
router.get('/agents/status', (req, res) => {
  const db = getDB();
  const isAdmin = req.user.role === 'admin';
  const agents = isAdmin
    ? db.prepare('SELECT id, name, status, hostname, ip_address, platform, last_seen FROM agents ORDER BY status').all()
    : db.prepare('SELECT id, name, status, hostname, ip_address, platform, last_seen FROM agents WHERE owner_id = ? ORDER BY status').all(req.user.id);

  // Enrich with live socket status
  const enriched = agents.map(a => ({
    ...a,
    isLive: connectedAgents.has(a.id)
  }));

  res.json({ agents: enriched });
});

// GET /api/dashboard/notifications
router.get('/notifications', (req, res) => {
  const db = getDB();
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);

  const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);

  res.json({ notifications, unreadCount: unread.count });
});

// POST /api/dashboard/notifications/read-all
router.post('/notifications/read-all', (req, res) => {
  const db = getDB();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
