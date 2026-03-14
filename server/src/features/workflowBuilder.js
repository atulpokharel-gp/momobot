/**
 * Visual Workflow Builder & Process Orchestration Engine
 * Enterprise-level workflow designer with approval workflows and AI-driven optimization
 * Similar to n8n but with MomoBot's security-first approach
 */

const EventEmitter = require('events');

class WorkflowBuilder extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.workflows = new Map();
    this.executionHistory = new Map();
  }

  /**
   * Create a new visual workflow
   */
  createWorkflow(name, description, nodes = [], edges = []) {
    try {
      // Validate workflow structure
      this.validateWorkflow(nodes, edges);

      const workflowId = this.db.prepare(
        `INSERT INTO visual_workflows (name, description, nodes, edges, status, version, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        name,
        description,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        'draft',
        1,
        'system',
        new Date().toISOString()
      ).lastInsertRowid;

      console.log(`[WorkflowBuilder] Created workflow: ${name} (ID: ${workflowId})`);

      return {
        id: workflowId,
        name,
        description,
        nodes,
        edges,
        status: 'draft',
        version: 1
      };
    } catch (error) {
      console.error('[WorkflowBuilder] Creation failed:', error);
      throw error;
    }
  }

  /**
   * Update workflow nodes and edges
   */
  updateWorkflow(workflowId, nodes, edges, description = null) {
    try {
      this.validateWorkflow(nodes, edges);

      this.db.prepare(
        `UPDATE visual_workflows 
         SET nodes = ?, edges = ?, description = ?, version = version + 1, updated_at = ?
         WHERE id = ?`
      ).run(
        JSON.stringify(nodes),
        JSON.stringify(edges),
        description,
        new Date().toISOString(),
        workflowId
      );

      return this.getWorkflow(workflowId);
    } catch (error) {
      console.error('[WorkflowBuilder] Update failed:', error);
      throw error;
    }
  }

  /**
   * Validate workflow structure
   */
  validateWorkflow(nodes, edges) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // Check for start node
    const hasStartNode = nodes.some(n => n.type === 'start');
    if (!hasStartNode) {
      throw new Error('Workflow must have a start node');
    }

    // Check for valid edges
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(`Invalid edge: ${edge.source} -> ${edge.target}`);
      }
    }

    return true;
  }

  /**
   * Submit workflow for approval
   */
  submitForApproval(workflowId, userId, comment = '') {
    try {
      const workflow = this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const approvalId = this.db.prepare(
        `INSERT INTO workflow_approvals (workflow_id, submitted_by, status, comment, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        workflowId,
        userId,
        'pending',
        comment,
        new Date().toISOString()
      ).lastInsertRowid;

      // Update workflow status
      this.db.prepare(
        `UPDATE visual_workflows SET status = ? WHERE id = ?`
      ).run('pending_approval', workflowId);

      // Emit event for notifications
      this.emit('workflow:pending_approval', {
        approvalId,
        workflowId,
        workflow,
        submittedBy: userId,
        comment
      });

      console.log(`[WorkflowBuilder] Submitted workflow ${workflowId} for approval`);
      return approvalId;
    } catch (error) {
      console.error('[WorkflowBuilder] Approval submission failed:', error);
      throw error;
    }
  }

  /**
   * Approve workflow
   */
  approveWorkflow(approvalId, approverId, notes = '') {
    try {
      const approval = this.db.prepare(
        `SELECT * FROM workflow_approvals WHERE id = ?`
      ).get(approvalId);

      if (!approval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }

      this.db.prepare(
        `UPDATE workflow_approvals 
         SET status = ?, approved_by = ?, approved_at = ?, notes = ?
         WHERE id = ?`
      ).run('approved', approverId, new Date().toISOString(), notes, approvalId);

      const workflowId = approval.workflow_id;
      this.db.prepare(
        `UPDATE visual_workflows SET status = ? WHERE id = ?`
      ).run('active', workflowId);

      this.emit('workflow:approved', {
        approvalId,
        workflowId,
        approverId,
        notes
      });

      console.log(`[WorkflowBuilder] Workflow ${workflowId} approved`);
      return this.getWorkflow(workflowId);
    } catch (error) {
      console.error('[WorkflowBuilder] Approval failed:', error);
      throw error;
    }
  }

  /**
   * Reject workflow
   */
  rejectWorkflow(approvalId, approverId, reason = '') {
    try {
      this.db.prepare(
        `UPDATE workflow_approvals 
         SET status = ?, rejected_by = ?, rejected_at = ?, rejection_reason = ?
         WHERE id = ?`
      ).run('rejected', approverId, new Date().toISOString(), reason, approvalId);

      const approval = this.db.prepare(
        `SELECT workflow_id FROM workflow_approvals WHERE id = ?`
      ).get(approvalId);

      this.db.prepare(
        `UPDATE visual_workflows SET status = ? WHERE id = ?`
      ).run('draft', approval.workflow_id);

      this.emit('workflow:rejected', {
        approvalId,
        workflowId: approval.workflow_id,
        approverId,
        reason
      });

      console.log(`[WorkflowBuilder] Workflow ${approval.workflow_id} rejected`);
      return approval.workflow_id;
    } catch (error) {
      console.error('[WorkflowBuilder] Rejection failed:', error);
      throw error;
    }
  }

  /**
   * Get workflow
   */
  getWorkflow(workflowId) {
    const workflow = this.db.prepare(
      `SELECT * FROM visual_workflows WHERE id = ?`
    ).get(workflowId);

    if (workflow) {
      workflow.nodes = JSON.parse(workflow.nodes);
      workflow.edges = JSON.parse(workflow.edges);
    }

    return workflow;
  }

  /**
   * Get workflow execution history with visualization
   */
  getExecutionHistory(workflowId, limit = 50) {
    const executions = this.db.prepare(
      `SELECT * FROM workflow_executions 
       WHERE workflow_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    ).all(workflowId, limit);

    return executions.map(exec => ({
      ...exec,
      execution_trace: JSON.parse(exec.execution_trace || '[]'),
      node_states: JSON.parse(exec.node_states || '{}')
    }));
  }

  /**
   * List all workflows with pagination
   */
  listWorkflows(status = null, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, name, description, status, version, created_at, updated_at FROM visual_workflows';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const workflows = this.db.prepare(query).all(...params);
    return workflows;
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(workflowId) {
    this.db.prepare(`DELETE FROM visual_workflows WHERE id = ?`).run(workflowId);
    console.log(`[WorkflowBuilder] Deleted workflow: ${workflowId}`);
  }

  /**
   * Clone workflow
   */
  cloneWorkflow(workflowId, newName) {
    const original = this.getWorkflow(workflowId);
    if (!original) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return this.createWorkflow(
      newName || `${original.name} (Clone)`,
      original.description,
      original.nodes,
      original.edges
    );
  }

  /**
   * Export workflow as JSON
   */
  exportWorkflow(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return {
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes,
      edges: workflow.edges,
      version: workflow.version,
      createdAt: workflow.created_at,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import workflow from JSON
   */
  importWorkflow(importData, userId) {
    return this.createWorkflow(
      importData.name,
      importData.description,
      importData.nodes,
      importData.edges
    );
  }
}

module.exports = WorkflowBuilder;
