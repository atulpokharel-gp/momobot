/**
 * Agent WebSocket Handler
 * Manages connections from MomoBot local agents
 */
const { getDB } = require('../db/database');

// Registry of connected agents: agentId -> socket
const connectedAgents = new Map();

function initAgentSocket(agentNamespace) {
  agentNamespace.use(async (socket, next) => {
    try {
      const apiKey = socket.handshake.auth.apiKey || socket.handshake.headers['x-api-key'];
      const secretKey = socket.handshake.auth.secretKey;

      if (!apiKey || !secretKey) {
        return next(new Error('Authentication required: apiKey and secretKey'));
      }

      const db = getDB();
      const agent = db.prepare('SELECT * FROM agents WHERE api_key = ? AND secret_key = ? AND is_active = 1').get(apiKey, secretKey);

      if (!agent) {
        return next(new Error('Invalid credentials'));
      }

      socket.agentId = agent.id;
      socket.agentData = agent;
      next();
    } catch (err) {
      console.error('[WS Agent] Auth error:', err.message);
      next(new Error('Authentication failed'));
    }
  });

  agentNamespace.on('connection', (socket) => {
    const { agentId, agentData } = socket;
    const db = getDB();

    console.log(`[WS Agent] 🤖 Agent connected: ${agentData.name} (${agentId})`);

    // Register in memory map
    connectedAgents.set(agentId, socket);

    // Update DB status
    db.prepare(`
      UPDATE agents SET status = 'online', last_seen = datetime('now'), last_ping = datetime('now')
      WHERE id = ?
    `).run(agentId);

    // Log connection
    db.prepare(`INSERT INTO agent_logs (agent_id, level, message) VALUES (?, 'info', 'Agent connected')`).run(agentId);

    // Notify all dashboard clients
    agentNamespace.server.of('/client').emit('agent:status', { agentId, status: 'online', name: agentData.name });

    // Send any pending tasks
    dispatchPendingTasks(socket, agentId, db);

    // Handle system info update from agent
    socket.on('system:info', (data) => {
      try {
        const { platform, hostname, ip, osInfo, version, capabilities } = data;
        db.prepare(`
          UPDATE agents SET
            platform = ?, hostname = ?, ip_address = ?, os_info = ?,
            agent_version = ?, capabilities = ?, last_seen = datetime('now'),
            updated_at = datetime('now')
          WHERE id = ?
        `).run(
          platform || null,
          hostname || null,
          ip || socket.handshake.address,
          osInfo ? JSON.stringify(osInfo) : null,
          version || null,
          JSON.stringify(capabilities || []),
          agentId
        );

        // Forward to dashboard
        agentNamespace.server.of('/client').emit('agent:updated', { agentId, platform, hostname, ip });
      } catch (err) {
        console.error('[WS Agent] system:info error:', err.message);
      }
    });

    // Handle task result from agent
    socket.on('task:result', (data) => {
      try {
        const { taskId, status, result, stdout, stderr, exitCode, error } = data;
        const now = new Date().toISOString();

        db.prepare(`
          UPDATE tasks SET
            status = ?, result = ?, stdout = ?, stderr = ?,
            exit_code = ?, error = ?,
            completed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ? AND agent_id = ?
        `).run(
          status || 'completed',
          result ? JSON.stringify(result) : null,
          stdout || null,
          stderr || null,
          exitCode !== undefined ? exitCode : null,
          error || null,
          taskId,
          agentId
        );

        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

        // Notify dashboard
        agentNamespace.server.of('/client').emit('task:updated', {
          taskId,
          agentId,
          status: status || 'completed',
          result,
          stdout,
          stderr,
          exitCode,
          error,
          completedAt: now
        });

        // Create notification for task owner
        if (task) {
          const notifType = status === 'failed' ? 'task_failed' : 'task_completed';
          const notifTitle = status === 'failed' ? 'Task Failed' : 'Task Completed';
          const notifMsg = `Task "${task.command.slice(0, 50)}" ${status} on agent ${agentData.name}`;

          db.prepare(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            task.created_by,
            notifType,
            notifTitle,
            notifMsg,
            JSON.stringify({ taskId, agentId, status })
          );
        }

        db.prepare(`INSERT INTO agent_logs (agent_id, level, message, data) VALUES (?, ?, ?, ?)`).run(
          agentId,
          status === 'failed' ? 'error' : 'info',
          `Task ${taskId} ${status}`,
          JSON.stringify({ taskId, exitCode })
        );
      } catch (err) {
        console.error('[WS Agent] task:result error:', err.message);
      }
    });

    // Handle task started notification
    socket.on('task:started', (data) => {
      const { taskId } = data;
      db.prepare('UPDATE tasks SET status = \'running\', started_at = datetime(\'now\') WHERE id = ?').run(taskId);
      agentNamespace.server.of('/client').emit('task:updated', { taskId, agentId, status: 'running' });
    });

    // Handle heartbeat / ping
    socket.on('ping', () => {
      db.prepare('UPDATE agents SET last_ping = datetime(\'now\') WHERE id = ?').run(agentId);
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle agent logs
    socket.on('log', (data) => {
      const { level = 'info', message, meta } = data;
      db.prepare('INSERT INTO agent_logs (agent_id, level, message, data) VALUES (?, ?, ?, ?)').run(
        agentId, level, message, meta ? JSON.stringify(meta) : null
      );
      // Forward to dashboard
      agentNamespace.server.of('/client').emit('agent:log', { agentId, level, message, meta, timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[WS Agent] 🔌 Agent disconnected: ${agentData.name} (${reason})`);
      connectedAgents.delete(agentId);

      db.prepare('UPDATE agents SET status = \'offline\', updated_at = datetime(\'now\') WHERE id = ?').run(agentId);
      db.prepare('INSERT INTO agent_logs (agent_id, level, message) VALUES (?, \'warn\', \'Agent disconnected\')').run(agentId);

      agentNamespace.server.of('/client').emit('agent:status', { agentId, status: 'offline', name: agentData.name });
    });
  });
}

// Send all pending tasks to a newly connected agent
function dispatchPendingTasks(socket, agentId, db) {
  const pendingTasks = db.prepare(`
    SELECT * FROM tasks WHERE agent_id = ? AND status = 'pending' ORDER BY priority DESC, created_at ASC
  `).all(agentId);

  pendingTasks.forEach(task => {
    socket.emit('task', {
      id: task.id,
      type: task.type,
      command: task.command,
      args: JSON.parse(task.args || '{}'),
      priority: task.priority,
      timeout: task.timeout
    });
    db.prepare('UPDATE tasks SET status = \'dispatched\' WHERE id = ?').run(task.id);
  });

  if (pendingTasks.length > 0) {
    console.log(`[WS Agent] Dispatched ${pendingTasks.length} pending tasks to ${agentId}`);
  }
}

module.exports = { initAgentSocket, connectedAgents };
