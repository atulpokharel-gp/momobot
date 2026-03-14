require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const EventEmitter = require('events');

const { initDB, getDB } = require('./db/database');
const { seedAdmin } = require('./db/seed');
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const taskRoutes = require('./routes/tasks');
const taskTypesRoutes = require('./routes/task-types');
const dashboardRoutes = require('./routes/dashboard');
const workflowRoutes = require('./routes/workflows');
const aiRoutes = require('./routes/ai');
const emailWorkflowRoutes = require('./routes/email-workflow');
const setupOptimizationRoutes = require('./routes/optimizations');
const scheduleRoutes = require('./routes/schedules');
const { initAgentSocket } = require('./websocket/agentSocket');
const { initClientSocket } = require('./websocket/clientSocket');
const { authenticate } = require('./middleware/auth');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new SocketServer(server, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 60000
});

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow React dev server
}));
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth needed)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/agents', apiLimiter, authenticate, agentRoutes);
app.use('/api/tasks', apiLimiter, authenticate, taskRoutes);
app.use('/api/task-types', apiLimiter, authenticate, taskTypesRoutes);
app.use('/api/workflows', apiLimiter, authenticate, workflowRoutes);
app.use('/api/email-workflow', apiLimiter, authenticate, emailWorkflowRoutes);
app.use('/api/ai', apiLimiter, authenticate, aiRoutes);
app.use('/api/schedules', apiLimiter, authenticate, scheduleRoutes);
app.use('/api/dashboard', apiLimiter, authenticate, dashboardRoutes);

// Make io accessible via req
app.set('io', io);

// Initialize WebSocket namespaces
const agentNamespace = io.of('/agents');   // For MomoBots connecting from local machines
const clientNamespace = io.of('/client');  // For browser dashboard clients

initAgentSocket(agentNamespace);
initClientSocket(clientNamespace, agentNamespace);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Startup
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Initialize database
    initDB();
    await seedAdmin();

    // Initialize optimization routes (requires DB)
    const db = getDB();
    const optimizationRoutes = setupOptimizationRoutes(db, null, EventEmitter);
    app.use('/api/optimizations', apiLimiter, authenticate, optimizationRoutes);

    server.listen(PORT, () => {
      console.log(`\n🚀 MomoBot Server running on port ${PORT}`);
      console.log(`📡 Agent WebSocket: ws://localhost:${PORT}/agents`);
      console.log(`🌐 Client WebSocket: ws://localhost:${PORT}/client`);
      console.log(`🔗 REST API: http://localhost:${PORT}/api`);
      console.log(`\nAdmin Login: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = { app, server, io };
