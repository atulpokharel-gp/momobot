const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../db/database');
const { connectedAgents } = require('../websocket/agentSocket');

const router = express.Router();

/**
 * POST /api/workflows/email-check
 * Create and execute an email checking workflow
 */
router.post('/email-check', 
  body('agent_id').notEmpty().isString(),
  body('email_folder').optional().isString().default('INBOX'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { agent_id, email_folder = 'INBOX' } = req.body;
    const db = getDB();

    // Verify agent exists
    const agent = db.prepare(
      'SELECT * FROM agents WHERE id = ? AND is_active = 1'
    ).get(agent_id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or not active' });
    }

    const workflowId = uuidv4();
    const createdAt = new Date().toISOString();

    // Create workflow record
    const workflowData = {
      type: 'email-check',
      email_folder,
      agent_id,
      status: 'pending'
    };

    db.prepare(`
      INSERT INTO visual_workflows (id, name, description, definition, agent_id, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      workflowId,
      `Check Email - ${email_folder}`,
      `Automated email checking workflow for ${email_folder} folder`,
      JSON.stringify(workflowData),
      agent_id,
      req.user?.id || 'system',
      createdAt
    );

    // Create execution record
    const executionId = uuidv4();
    db.prepare(`
      INSERT INTO workflow_executions (id, workflow_id, status, started_at)
      VALUES (?, ?, 'running', ?)
    `).run(executionId, workflowId, createdAt);

    // Try to dispatch to connected agent
    const agentSocket = connectedAgents.get(agent_id);
    if (agentSocket) {
      agentSocket.emit('task', {
        id: executionId,
        type: 'email_check',
        command: 'check_email',
        args: {
          folder: email_folder,
          max_results: 10
        },
        priority: 5,
        timeout: 30000
      });
    }

    res.json({
      success: true,
      workflowId,
      executionId,
      agentId: agent_id,
      status: 'pending',
      message: 'Email check workflow initiated',
      data: {
        workflow: {
          id: workflowId,
          name: `Check Email - ${email_folder}`,
          type: 'email-check',
          agent_id,
          status: 'pending',
          created_at: createdAt
        },
        execution: {
          id: executionId,
          workflow_id: workflowId,
          status: 'running',
          started_at: createdAt
        }
      }
    });
  }
);

/**
 * GET /api/workflows/:id/status
 * Get workflow status and execution details
 */
router.get('/:id/status', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const workflow = db.prepare(`
    SELECT * FROM visual_workflows WHERE id = ?
  `).get(id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const execution = db.prepare(`
    SELECT * FROM workflow_executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 1
  `).get(id);

  res.json({
    success: true,
    workflow: {
      ...workflow,
      definition: JSON.parse(workflow.definition || '{}')
    },
    execution: execution || null
  });
});

/**
 * GET /api/workflows
 * List workflows
 */
router.get('/', (req, res) => {
  const { agent_id, status, limit = 20, offset = 0 } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM visual_workflows WHERE 1=1';
  const params = [];

  if (agent_id) {
    query += ' AND agent_id = ?';
    params.push(agent_id);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const workflows = db.prepare(query).all(...params);

  res.json({
    success: true,
    workflows: workflows.map(w => ({
      ...w,
      definition: JSON.parse(w.definition || '{}')
    }))
  });
});

/**
 * POST /api/workflows/:id/retry
 * Retry a failed workflow
 */
router.post('/:id/retry', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const workflow = db.prepare('SELECT * FROM visual_workflows WHERE id = ?').get(id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const executionId = uuidv4();
  const createdAt = new Date().toISOString();

  // Create new execution
  db.prepare(`
    INSERT INTO workflow_executions (id, workflow_id, status, started_at)
    VALUES (?, ?, 'running', ?)
  `).run(executionId, id, createdAt);

  // Update workflow status
  db.prepare('UPDATE visual_workflows SET status = ? WHERE id = ?').run('pending', id);

  // Try to dispatch to agent
  const definition = JSON.parse(workflow.definition);
  const agentSocket = connectedAgents.get(workflow.agent_id);
  
  if (agentSocket) {
    agentSocket.emit('task', {
      id: executionId,
      type: definition.type || 'email_check',
      command: 'check_email',
      args: definition.args || { folder: 'INBOX', max_results: 10 },
      priority: 5,
      timeout: 30000
    });
  }

  res.json({
    success: true,
    executionId,
    message: 'Workflow retry initiated',
    execution: {
      id: executionId,
      workflow_id: id,
      status: 'running',
      started_at: createdAt
    }
  });
});

module.exports = router;
