require('dotenv').config();
const { io } = require('socket.io-client');
const logger = require('./logger');
const { getSystemInfo } = require('./tasks/systemInfo');
const { executeShell } = require('./tasks/shell');
const { readFile, writeFile } = require('./tasks/fileOps');
const { getProcessList } = require('./tasks/processList');
const { takeScreenshot } = require('./tasks/screenshot');
const { checkEmail, monitorEmail, getEmailStats } = require('./tasks/email');
const { openBrowser, playYouTubeVideo, navigateTo, closeBrowser } = require('./tasks/browser');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const API_KEY = process.env.AGENT_API_KEY;
const SECRET_KEY = process.env.AGENT_SECRET_KEY;

if (!API_KEY || !SECRET_KEY) {
  logger.error('AGENT_API_KEY and AGENT_SECRET_KEY must be set in .env');
  process.exit(1);
}

const AGENT_VERSION = '1.0.0';
let socket;
let heartbeatInterval;
let isConnected = false;
const activeTasks = new Map();

function connect() {
  logger.info(`Connecting to MomoBot server: ${SERVER_URL}`);

  socket = io(`${SERVER_URL}/agents`, {
    auth: { apiKey: API_KEY, secretKey: SECRET_KEY },
    reconnection: true,
    reconnectionDelay: parseInt(process.env.RECONNECT_DELAY) || 5000,
    reconnectionAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 100,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', async () => {
    isConnected = true;
    logger.info('✅ Connected to MomoBot server');

    // Send system info on connect
    try {
      const sysInfo = await getSystemInfo();
      socket.emit('system:info', sysInfo);
      logger.info(`System info sent: ${sysInfo.hostname} (${sysInfo.platform})`);
    } catch (err) {
      logger.warn('Could not gather system info:', err.message);
    }

    // Start heartbeat
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      socket.emit('ping');
    }, parseInt(process.env.HEARTBEAT_INTERVAL) || 30000);
  });

  socket.on('pong', () => {
    logger.debug('Heartbeat OK');
  });

  socket.on('disconnect', (reason) => {
    isConnected = false;
    clearInterval(heartbeatInterval);
    logger.warn(`Disconnected from server: ${reason}`);
  });

  socket.on('connect_error', (err) => {
    logger.error(`Connection error: ${err.message}`);
  });

  // Main task handler
  socket.on('task', async (task) => {
    logger.info(`📋 Task received: [${task.type}] ${task.command} (id: ${task.id})`);
    handleTask(task);
  });

  // Task cancellation
  socket.on('task:cancel', ({ taskId }) => {
    const controller = activeTasks.get(taskId);
    if (controller) {
      controller.abort();
      activeTasks.delete(taskId);
      logger.info(`Task ${taskId} cancelled`);
    }
  });

  // Direct command from dashboard
  socket.on('command', ({ command, from }) => {
    logger.info(`💬 Direct command from ${from}: ${command}`);
    handleTask({ id: `cmd_${Date.now()}`, type: 'shell', command, timeout: 30000 });
  });

  socket.on('reconnect', (attemptNumber) => {
    logger.info(`Reconnected after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_failed', () => {
    logger.error('Failed to reconnect. Please check server URL and credentials.');
  });
}

async function handleTask(task) {
  const { id, type, command, args = {}, timeout = 30000 } = task;

  // Notify server task started
  socket.emit('task:started', { taskId: id });

  const controller = new AbortController();
  activeTasks.set(id, controller);

  const timeoutId = setTimeout(() => {
    controller.abort();
    socket.emit('task:result', {
      taskId: id,
      status: 'failed',
      error: `Task timed out after ${timeout}ms`
    });
    activeTasks.delete(id);
  }, timeout + 1000);

  try {
    let result;

    switch (type) {
      case 'shell':
        result = await executeShell(command, args, controller.signal);
        break;

      case 'script':
        result = await executeShell(command, { ...args, shell: true }, controller.signal);
        break;

      case 'system_info':
        result = { data: await getSystemInfo() };
        break;

      case 'file_read':
        result = await readFile(command, args);
        break;

      case 'file_write':
        result = await writeFile(command, args);
        break;

      case 'process_list':
        result = { data: await getProcessList() };
        break;

      case 'screenshot':
        result = await takeScreenshot();
        break;

      case 'email_check':
        result = { data: await checkEmail(args.folder || 'INBOX', args.max_results || 10) };
        break;

      case 'email_monitor':
        result = { data: await monitorEmail(args.folder || 'INBOX', args.interval || 300000) };
        break;

      case 'email_stats':
        result = { data: await getEmailStats() };
        break;

      case 'browser_open':
        result = await openBrowser(args.url || '', args.browserType);
        break;

      case 'browser_youtube':
        result = await playYouTubeVideo(args.videoId, args);
        break;

      case 'browser_navigate':
        result = await navigateTo(command, args);
        break;

      case 'browser_close':
        result = await closeBrowser();
        break;

      case 'custom':
        result = { data: `Custom task received: ${command}` };
        break;

      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    clearTimeout(timeoutId);
    activeTasks.delete(id);

    socket.emit('task:result', {
      taskId: id,
      status: 'completed',
      result: result?.data || null,
      stdout: result?.stdout || null,
      stderr: result?.stderr || null,
      exitCode: result?.exitCode ?? 0
    });

    logger.info(`✅ Task ${id} completed`);
  } catch (err) {
    clearTimeout(timeoutId);
    activeTasks.delete(id);

    if (err.name === 'AbortError') {
      logger.warn(`Task ${id} was cancelled`);
      return;
    }

    logger.error(`❌ Task ${id} failed: ${err.message}`);
    socket.emit('task:result', {
      taskId: id,
      status: 'failed',
      error: err.message,
      stderr: err.stderr || null,
      exitCode: err.exitCode ?? 1
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, disconnecting...');
  clearInterval(heartbeatInterval);
  socket?.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Shutting down MomoBot agent...');
  clearInterval(heartbeatInterval);
  socket?.disconnect();
  process.exit(0);
});

// Start
logger.info(`🤖 MomoBot Agent v${AGENT_VERSION} starting...`);
connect();
