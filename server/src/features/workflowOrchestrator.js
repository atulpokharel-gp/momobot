/**
 * Process Orchestration & Execution Engine
 * Executes visual workflows with state tracking and optimization suggestions
 */

const EventEmitter = require('events');

class WorkflowOrchestrator extends EventEmitter {
  constructor(db, scheduler, notificationService) {
    super();
    this.db = db;
    this.scheduler = scheduler;
    this.notificationService = notificationService;
    this.activeExecutions = new Map();
  }

  /**
   * Execute workflow with full visualization of what it will do
   */
  async executeWorkflow(workflowId, variables = {}, initiatedBy = 'system') {
    const workflow = this.db.prepare(
      `SELECT * FROM visual_workflows WHERE id = ?`
    ).get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const nodes = JSON.parse(workflow.nodes);
    const edges = JSON.parse(workflow.edges);

    // Create execution record
    const executionId = this.db.prepare(
      `INSERT INTO workflow_executions (workflow_id, status, initiated_by, variables, started_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      workflowId,
      'running',
      initiatedBy,
      JSON.stringify(variables),
      new Date().toISOString()
    ).lastInsertRowid;

    const execution = {
      id: executionId,
      workflowId,
      nodes,
      edges,
      variables,
      nodeStates: {},
      executionTrace: [],
      startTime: Date.now()
    };

    this.activeExecutions.set(executionId, execution);

    try {
      // Build execution plan
      const executionPlan = this.buildExecutionPlan(nodes, edges);
      
      // Emit plan for user visualization
      this.emit('workflow:execution_plan', {
        executionId,
        workflowId,
        plan: executionPlan,
        estimatedDuration: this.estimateDuration(executionPlan)
      });

      // Execute nodes in sequence
      for (const nodeId of executionPlan) {
        const node = nodes.find(n => n.id === nodeId);
        const result = await this.executeNode(node, execution, variables);

        execution.nodeStates[nodeId] = result.state;
        execution.executionTrace.push({
          nodeId,
          type: node.type,
          status: result.success ? 'completed' : 'failed',
          duration: result.duration,
          output: result.output,
          error: result.error,
          timestamp: new Date().toISOString()
        });

        // Emit real-time execution updates
        this.emit('workflow:node_executed', {
          executionId,
          nodeId,
          result
        });

        // Stop on failure if configured
        if (!result.success && node.stopOnFailure) {
          throw new Error(`Node ${nodeId} failed: ${result.error}`);
        }
      }

      // Mark execution as completed
      this.db.prepare(
        `UPDATE workflow_executions 
         SET status = ?, completed_at = ?, execution_trace = ?, node_states = ?
         WHERE id = ?`
      ).run(
        'completed',
        new Date().toISOString(),
        JSON.stringify(execution.executionTrace),
        JSON.stringify(execution.nodeStates),
        executionId
      );

      const duration = Date.now() - execution.startTime;
      this.emit('workflow:completed', {
        executionId,
        workflowId,
        duration,
        nodeStates: execution.nodeStates
      });

      console.log(`[Orchestrator] Workflow ${workflowId} completed in ${duration}ms`);
      return { executionId, status: 'completed', duration };
    } catch (error) {
      // Mark execution as failed
      this.db.prepare(
        `UPDATE workflow_executions 
         SET status = ?, completed_at = ?, error = ?, execution_trace = ?
         WHERE id = ?`
      ).run(
        'failed',
        new Date().toISOString(),
        error.message,
        JSON.stringify(execution.executionTrace),
        executionId
      );

      this.emit('workflow:failed', {
        executionId,
        workflowId,
        error: error.message
      });

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Build execution plan (topological sort)
   */
  buildExecutionPlan(nodes, edges) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map();
    const adjList = new Map();

    // Initialize
    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }

    // Build adjacency list
    for (const edge of edges) {
      adjList.get(edge.source).push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Topological sort (Kahn's algorithm)
    const queue = Array.from(nodes)
      .filter(n => inDegree.get(n.id) === 0)
      .map(n => n.id);
    const plan = [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      plan.push(nodeId);

      for (const neighbor of adjList.get(nodeId)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (plan.length !== nodes.length) {
      throw new Error('Workflow contains cycles');
    }

    return plan;
  }

  /**
   * Execute a single node
   */
  async executeNode(node, execution, variables) {
    const startTime = Date.now();

    try {
      let output = null;

      switch (node.type) {
        case 'start':
          output = { message: 'Workflow started' };
          break;

        case 'task':
          output = await this.executeTask(node, variables);
          break;

        case 'condition':
          output = await this.evaluateCondition(node, variables);
          break;

        case 'webhook':
          output = await this.callWebhook(node, variables);
          break;

        case 'notification':
          output = await this.sendNotification(node, variables);
          break;

        case 'delay':
          output = await this.delay(node.config?.milliseconds || 1000);
          break;

        case 'end':
          output = { message: 'Workflow ended' };
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      return {
        success: true,
        output,
        duration: Date.now() - startTime,
        state: 'success'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        state: 'error'
      };
    }
  }

  /**
   * Execute a task node
   */
  async executeTask(node, variables) {
    const { taskType, payload } = node.config;
    
    // Resolve variables in payload
    const resolvedPayload = this.resolveVariables(payload, variables);

    // This would integrate with your task execution engine
    return {
      taskType,
      status: 'executed',
      payload: resolvedPayload
    };
  }

  /**
   * Evaluate condition node
   */
  async evaluateCondition(node, variables) {
    const { condition } = node.config;
    const result = await this.evaluateExpression(condition, variables);

    return {
      condition,
      result,
      message: result ? 'Condition met' : 'Condition not met'
    };
  }

  /**
   * Call webhook
   */
  async callWebhook(node, variables) {
    const { url, method = 'POST', headers = {}, body } = node.config;
    
    const resolvedBody = this.resolveVariables(body, variables);

    // This would be implemented with axios
    return {
      url,
      method,
      status: 'webhook_called'
    };
  }

  /**
   * Send notification
   */
  async sendNotification(node, variables) {
    const { type, recipient, message } = node.config;
    
    const resolvedMessage = this.resolveVariables(message, variables);

    return {
      type,
      recipient,
      message: resolvedMessage,
      sent: true
    };
  }

  /**
   * Delay execution
   */
  delay(milliseconds) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ delayed: milliseconds }), milliseconds);
    });
  }

  /**
   * Resolve variables in object
   */
  resolveVariables(obj, variables) {
    const stringified = JSON.stringify(obj);
    let resolved = stringified;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      resolved = resolved.replace(regex, typeof value === 'string' ? value : JSON.stringify(value));
    }

    return JSON.parse(resolved);
  }

  /**
   * Evaluate expression
   */
  async evaluateExpression(expression, variables) {
    // Simple expression evaluator (can be enhanced)
    const Function = (new Function).constructor;
    const func = new Function(...Object.keys(variables), `return ${expression}`);
    return func(...Object.values(variables));
  }

  /**
   * Estimate workflow duration
   */
  estimateDuration(executionPlan) {
    // Returns estimated duration in milliseconds
    return executionPlan.length * 100; // Placeholder
  }

  /**
   * Get execution details
   */
  getExecutionDetails(executionId) {
    const execution = this.db.prepare(
      `SELECT * FROM workflow_executions WHERE id = ?`
    ).get(executionId);

    if (execution) {
      execution.execution_trace = JSON.parse(execution.execution_trace || '[]');
      execution.node_states = JSON.parse(execution.node_states || '{}');
    }

    return execution;
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      this.activeExecutions.delete(executionId);
      
      this.db.prepare(
        `UPDATE workflow_executions SET status = ?, completed_at = ? WHERE id = ?`
      ).run('cancelled', new Date().toISOString(), executionId);

      this.emit('workflow:cancelled', { executionId });
      return true;
    }
    return false;
  }
}

module.exports = WorkflowOrchestrator;
