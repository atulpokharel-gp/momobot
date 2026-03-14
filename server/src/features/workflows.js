/**
 * Task Templates & Workflows
 * Enables reusable task templates and complex workflow orchestration
 */

class WorkflowEngine {
  constructor(db) {
    this.db = db;
    this.workflows = new Map();
  }

  /**
   * Create a new workflow template
   */
  createWorkflow(name, description, steps, variables = {}) {
    try {
      const workflowId = this.db.prepare(
        `INSERT INTO workflows (name, description, steps, variables, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        name,
        description,
        JSON.stringify(steps),
        JSON.stringify(variables),
        new Date().toISOString()
      ).lastInsertRowid;

      console.log(`[Workflows] Created workflow: ${name} (ID: ${workflowId})`);
      return this.getWorkflow(workflowId);
    } catch (error) {
      console.error('[Workflows] Creation failed:', error);
      throw error;
    }
  }

  /**
   * Create a task template
   */
  createTaskTemplate(name, description, taskType, payload, variables = {}) {
    try {
      const templateId = this.db.prepare(
        `INSERT INTO task_templates (name, description, task_type, payload, variables, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        name,
        description,
        taskType,
        JSON.stringify(payload),
        JSON.stringify(variables),
        new Date().toISOString()
      ).lastInsertRowid;

      console.log(`[Templates] Created template: ${name} (ID: ${templateId})`);
      return this.getTemplate(templateId);
    } catch (error) {
      console.error('[Templates] Creation failed:', error);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId) {
    const workflow = this.db.prepare(
      `SELECT * FROM workflows WHERE id = ?`
    ).get(workflowId);

    if (workflow) {
      workflow.steps = JSON.parse(workflow.steps);
      workflow.variables = JSON.parse(workflow.variables);
    }

    return workflow;
  }

  /**
   * Get task template by ID
   */
  getTemplate(templateId) {
    const template = this.db.prepare(
      `SELECT * FROM task_templates WHERE id = ?`
    ).get(templateId);

    if (template) {
      template.payload = JSON.parse(template.payload);
      template.variables = JSON.parse(template.variables);
    }

    return template;
  }

  /**
   * Execute workflow with given variables
   */
  async executeWorkflow(workflowId, variables = {}, deviceId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = this.db.prepare(
      `INSERT INTO workflow_executions (workflow_id, variables, status, started_at)
       VALUES (?, ?, ?, ?)`
    ).run(
      workflowId,
      JSON.stringify(variables),
      'running',
      new Date().toISOString()
    ).lastInsertRowid;

    try {
      const results = [];

      for (const step of workflow.steps) {
        const resolvedPayload = this.resolveVariables(step.payload, variables);
        const stepResult = await this.executeWorkflowStep(
          step,
          resolvedPayload,
          deviceId
        );

        results.push(stepResult);

        // Handle step failures
        if (!stepResult.success && step.onFailure === 'stop') {
          throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
        }

        // Update variables with step output
        if (stepResult.output) {
          variables[`step_${step.id}_output`] = stepResult.output;
        }
      }

      // Mark execution as completed
      this.db.prepare(
        `UPDATE workflow_executions 
         SET status = ?, completed_at = ?, results = ?
         WHERE id = ?`
      ).run(
        'completed',
        new Date().toISOString(),
        JSON.stringify(results),
        executionId
      );

      return { executionId, status: 'completed', results };
    } catch (error) {
      // Mark execution as failed
      this.db.prepare(
        `UPDATE workflow_executions 
         SET status = ?, completed_at = ?, error = ?
         WHERE id = ?`
      ).run(
        'failed',
        new Date().toISOString(),
        error.message,
        executionId
      );

      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  async executeWorkflowStep(step, payload, deviceId) {
    try {
      // This would integrate with your task execution engine
      // For now, return a mock result
      return {
        stepId: step.id,
        success: true,
        output: { message: `Step ${step.id} completed` }
      };
    } catch (error) {
      return {
        stepId: step.id,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve variables in payload
   */
  resolveVariables(payload, variables) {
    const stringified = JSON.stringify(payload);
    let resolved = stringified;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      resolved = resolved.replace(regex, value);
    }

    return JSON.parse(resolved);
  }

  /**
   * Create task from template
   */
  createTaskFromTemplate(templateId, variables = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const payload = this.resolveVariables(template.payload, variables);

    return {
      templateId,
      taskType: template.task_type,
      payload,
      variables
    };
  }

  /**
   * List all workflows
   */
  listWorkflows() {
    return this.db.prepare(
      `SELECT id, name, description, created_at FROM workflows ORDER BY created_at DESC`
    ).all();
  }

  /**
   * List all task templates
   */
  listTemplates() {
    return this.db.prepare(
      `SELECT id, name, description, task_type, created_at FROM task_templates ORDER BY created_at DESC`
    ).all();
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(workflowId) {
    this.db.prepare(`DELETE FROM workflows WHERE id = ?`).run(workflowId);
    console.log(`[Workflows] Deleted workflow: ${workflowId}`);
  }

  /**
   * Delete task template
   */
  deleteTemplate(templateId) {
    this.db.prepare(`DELETE FROM task_templates WHERE id = ?`).run(templateId);
    console.log(`[Templates] Deleted template: ${templateId}`);
  }
}

module.exports = WorkflowEngine;
