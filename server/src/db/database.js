const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/momobot.db';
const dbDir = path.dirname(path.resolve(DB_PATH));

let db;

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

function initDB() {
  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(path.resolve(DB_PATH));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      api_key TEXT UNIQUE,
      refresh_token TEXT,
      last_login TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Agents (MomoBots) table
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      secret_key TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      platform TEXT,
      hostname TEXT,
      ip_address TEXT,
      os_info TEXT,
      agent_version TEXT,
      capabilities TEXT DEFAULT '[]',
      last_seen TEXT,
      last_ping TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      agent_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      type TEXT NOT NULL,
      command TEXT NOT NULL,
      args TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 5,
      result TEXT,
      error TEXT,
      stdout TEXT,
      stderr TEXT,
      exit_code INTEGER,
      started_at TEXT,
      completed_at TEXT,
      timeout INTEGER DEFAULT 30000,
      ai_model TEXT DEFAULT 'none',
      ai_thinking TEXT,
      workflow TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Agent logs table
    CREATE TABLE IF NOT EXISTS agent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );

    -- Sessions table (for tracking active logins)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      refresh_token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Visual Workflows (n8n-style DAG workflows)
    CREATE TABLE IF NOT EXISTS visual_workflows (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      description TEXT,
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Workflow Approvals
    CREATE TABLE IF NOT EXISTS workflow_approvals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workflow_id TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      approved_by TEXT,
      approved_at TEXT,
      notes TEXT,
      rejected_by TEXT,
      rejected_at TEXT,
      rejection_reason TEXT,
      FOREIGN KEY (workflow_id) REFERENCES visual_workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Workflow Executions
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workflow_id TEXT NOT NULL,
      status TEXT DEFAULT 'running',
      initiated_by TEXT NOT NULL,
      variables TEXT DEFAULT '{}',
      execution_trace TEXT DEFAULT '[]',
      node_states TEXT DEFAULT '{}',
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      duration INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES visual_workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Workflow Optimizations
    CREATE TABLE IF NOT EXISTS workflow_optimizations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workflow_id TEXT NOT NULL,
      optimization_type TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      applied_at TEXT,
      FOREIGN KEY (workflow_id) REFERENCES visual_workflows(id) ON DELETE CASCADE
    );

    -- Schedules (cron-based task scheduling)
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      description TEXT,
      cron_expression TEXT NOT NULL,
      task_id TEXT,
      workflow_id TEXT,
      status TEXT DEFAULT 'active',
      estimated_duration INTEGER DEFAULT 300,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
      FOREIGN KEY (workflow_id) REFERENCES visual_workflows(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Schedule Executions
    CREATE TABLE IF NOT EXISTS schedule_executions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      schedule_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      duration INTEGER,
      result TEXT,
      error TEXT,
      executed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    );

    -- Schedule Optimizations
    CREATE TABLE IF NOT EXISTS schedule_optimizations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      optimization_id TEXT NOT NULL,
      type TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      recommended_at TEXT,
      applied_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Optimization Feedback
    CREATE TABLE IF NOT EXISTS optimization_feedback (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      optimization_id TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      feedback TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    -- Custom Task Types (saved workflows as reusable task types)
    CREATE TABLE IF NOT EXISTS custom_task_types (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      type TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '⚡',
      is_custom INTEGER DEFAULT 1,
      workflow_definition TEXT NOT NULL,
      agent_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      usage_count INTEGER DEFAULT 0,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
    CREATE INDEX IF NOT EXISTS idx_agents_api_key ON agents(api_key);
    CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
    CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_visual_workflows_created_by ON visual_workflows(created_by);
    CREATE INDEX IF NOT EXISTS idx_workflow_approvals_workflow ON workflow_approvals(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status ON workflow_approvals(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
    CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
    CREATE INDEX IF NOT EXISTS idx_schedule_executions_schedule ON schedule_executions(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_custom_task_types_type ON custom_task_types(type);
    CREATE INDEX IF NOT EXISTS idx_custom_task_types_created_by ON custom_task_types(created_by);
  `);

  console.log('[DB] Database initialized at:', path.resolve(DB_PATH));
  return db;
}

module.exports = { initDB, getDB };
