/**
 * Client WebSocket Handler
 * Manages connections from browser dashboard clients
 */
const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');
const { connectedAgents } = require('./agentSocket');

function initClientSocket(clientNamespace, agentNamespace) {
  // Auth middleware for client connections
  clientNamespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const db = getDB();
      const user = db.prepare('SELECT id, username, role FROM users WHERE id = ? AND is_active = 1').get(decoded.userId);

      if (!user) return next(new Error('User not found'));

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.username = user.username;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  clientNamespace.on('connection', (socket) => {
    console.log(`[WS Client] 🖥️ Dashboard connected: ${socket.username} (${socket.userId})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === 'admin') socket.join('admin');

    // Send initial agent statuses
    const db = getDB();
    const agents = socket.userRole === 'admin'
      ? db.prepare('SELECT id, name, status, hostname, ip_address, platform, last_seen FROM agents').all()
      : db.prepare('SELECT id, name, status, hostname, ip_address, platform, last_seen FROM agents WHERE owner_id = ?').all(socket.userId);

    const enriched = agents.map(a => ({ ...a, isLive: connectedAgents.has(a.id) }));
    socket.emit('agents:initial', { agents: enriched });

    // Handle request to send command to agent
    socket.on('agent:command', (data) => {
      const { agentId, command } = data;
      const agentSocket = connectedAgents.get(agentId);
      if (agentSocket) {
        agentSocket.emit('command', { command, from: socket.username });
        socket.emit('agent:command:sent', { agentId, command, status: 'delivered' });
      } else {
        socket.emit('agent:command:failed', { agentId, reason: 'Agent is offline' });
      }
    });

    // Subscribe to specific agent updates
    socket.on('agent:subscribe', (data) => {
      const { agentId } = data;
      socket.join(`agent:${agentId}`);
    });

    socket.on('agent:unsubscribe', (data) => {
      const { agentId } = data;
      socket.leave(`agent:${agentId}`);
    });

    // Request live agent metrics
    socket.on('agent:metrics', (data) => {
      const { agentId } = data;
      const agentSocket = connectedAgents.get(agentId);
      if (agentSocket) {
        agentSocket.emit('metrics:request', {}, (metrics) => {
          socket.emit('agent:metrics:response', { agentId, metrics });
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WS Client] Dashboard disconnected: ${socket.username}`);
    });
  });
}

module.exports = { initClientSocket };
