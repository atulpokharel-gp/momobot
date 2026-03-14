/**
 * AI-Driven Process Optimization Engine
 * Analyzes workflow execution patterns and suggests optimizations
 * Learns from schedule and usage patterns to improve efficiency
 */

class ProcessOptimizer {
  constructor(db) {
    this.db = db;
  }

  /**
   * Analyze workflow and suggest optimizations
   */
  analyzeWorkflow(workflowId) {
    try {
      const workflow = this.db.prepare(
        `SELECT * FROM visual_workflows WHERE id = ?`
      ).get(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const nodes = JSON.parse(workflow.nodes);
      const edges = JSON.parse(workflow.edges);
      const executions = this.getWorkflowExecutions(workflowId, 100);

      // Analyze execution patterns
      const stats = this.calculateExecutionStats(executions);
      const criticalPath = this.identifyCriticalPath(nodes, edges, executions);
      const bottlenecks = this.identifyBottlenecks(nodes, stats);
      const parallelOpportunities = this.findParallelizationOpportunities(nodes, edges);
      const redundancies = this.detectRedundancies(nodes, edges);

      const suggestions = [];

      // Generate optimization suggestions
      if (bottlenecks.length > 0) {
        suggestions.push({
          type: 'performance',
          priority: 'high',
          title: 'Optimize Slow Nodes',
          description: `The following nodes are bottlenecks: ${bottlenecks.map(b => b.nodeId).join(', ')}`,
          details: bottlenecks,
          estimatedImprovement: '20-40%'
        });
      }

      if (parallelOpportunities.length > 0) {
        suggestions.push({
          type: 'architecture',
          priority: 'high',
          title: 'Parallelize Execution',
          description: `${parallelOpportunities.length} node(s) can be executed in parallel`,
          details: parallelOpportunities,
          estimatedImprovement: '30-60%'
        });
      }

      if (redundancies.length > 0) {
        suggestions.push({
          type: 'efficiency',
          priority: 'medium',
          title: 'Remove Redundancies',
          description: `Found ${redundancies.length} redundant node(s)`,
          details: redundancies,
          estimatedImprovement: '10-25%'
        });
      }

      // Schedule-based optimization
      const scheduleOptimization = this.optimizeForSchedule(workflowId, executions);
      if (scheduleOptimization) {
        suggestions.push(scheduleOptimization);
      }

      return {
        workflowId,
        analyzedAt: new Date().toISOString(),
        executionStats: stats,
        criticalPath,
        suggestions,
        overallRiskScore: this.calculateRiskScore(stats, bottlenecks)
      };
    } catch (error) {
      console.error('[ProcessOptimizer] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Apply optimization to workflow
   */
  applyOptimization(workflowId, optimizationId) {
    try {
      const analysis = this.analyzeWorkflow(workflowId);
      const suggestion = analysis.suggestions.find(s => s.id === optimizationId);

      if (!suggestion) {
        throw new Error(`Optimization not found: ${optimizationId}`);
      }

      // Save optimization request
      const optimizationRequestId = this.db.prepare(
        `INSERT INTO workflow_optimizations (workflow_id, optimization_type, details, status, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        workflowId,
        suggestion.type,
        JSON.stringify(suggestion),
        'pending',
        new Date().toISOString()
      ).lastInsertRowid;

      console.log(`[ProcessOptimizer] Optimization request created: ${optimizationRequestId}`);
      return optimizationRequestId;
    } catch (error) {
      console.error('[ProcessOptimizer] Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Calculate execution statistics
   */
  calculateExecutionStats(executions) {
    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        averageDuration: 0,
        successRate: 0,
        failureRate: 0,
        lastExecution: null
      };
    }

    const durations = [];
    const results = executions.map(e => ({
      duration: e.duration || 0,
      status: e.status,
      createdAt: e.created_at
    }));

    let successCount = 0;
    for (const result of results) {
      durations.push(result.duration);
      if (result.status === 'completed') successCount++;
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const successRate = (successCount / results.length) * 100;

    return {
      totalExecutions: results.length,
      averageDuration: Math.round(avgDuration),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: Math.round(successRate),
      failureRate: Math.round(100 - successRate),
      lastExecution: results[0]?.createdAt
    };
  }

  /**
   * Identify critical path in workflow
   */
  identifyCriticalPath(nodes, edges, executions) {
    // Find the longest path from start to end node
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const adjList = new Map();

    for (const node of nodes) {
      adjList.set(node.id, []);
    }

    for (const edge of edges) {
      adjList.get(edge.source).push(edge.target);
    }

    // Simple DFS to find longest path
    const nodePerformance = this.getNodePerformanceMetrics(nodes, executions);
    const visited = new Set();
    let criticalPath = [];
    let maxDuration = 0;

    const dfs = (nodeId, path, duration) => {
      visited.add(nodeId);
      path.push(nodeId);
      duration += nodePerformance[nodeId]?.averageDuration || 0;

      if (adjList.get(nodeId).length === 0) {
        // End node
        if (duration > maxDuration) {
          maxDuration = duration;
          criticalPath = [...path];
        }
      }

      for (const neighbor of adjList.get(nodeId)) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, path, duration);
        }
      }

      path.pop();
      visited.delete(nodeId);
    };

    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) {
      dfs(startNode.id, [], 0);
    }

    return {
      path: criticalPath.map(id => nodeMap.get(id)?.name || id),
      estimatedDuration: maxDuration,
      nodesCount: criticalPath.length
    };
  }

  /**
   * Identify bottleneck nodes
   */
  identifyBottlenecks(nodes, stats) {
    const nodePerformance = this.getNodePerformanceMetrics(nodes, []);
    const bottlenecks = [];

    // Average duration across all nodes
    const avgDuration = Object.values(nodePerformance)
      .filter(p => p.executionCount > 0)
      .reduce((sum, p) => sum + p.averageDuration, 0) / Object.keys(nodePerformance).length;

    for (const [nodeId, perf] of Object.entries(nodePerformance)) {
      if (perf.averageDuration > avgDuration * 2 && perf.executionCount > 0) {
        bottlenecks.push({
          nodeId,
          nodeName: nodes.find(n => n.id === nodeId)?.name || nodeId,
          averageDuration: Math.round(perf.averageDuration),
          executionCount: perf.executionCount,
          slowdownFactor: (perf.averageDuration / avgDuration).toFixed(2)
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Find parallelization opportunities
   */
  findParallelizationOpportunities(nodes, edges) {
    const adjList = new Map();
    const inDegree = new Map();

    for (const node of nodes) {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    for (const edge of edges) {
      adjList.get(edge.source).push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const opportunities = [];

    for (const node of nodes) {
      if (node.type === 'task' && adjList.get(node.id).length > 1) {
        const independentChildren = adjList
          .get(node.id)
          .filter(childId => adjList.get(childId).length === 1);

        if (independentChildren.length > 1) {
          opportunities.push({
            parentNode: node.name,
            childNodes: independentChildren
              .map(id => nodes.find(n => n.id === id)?.name)
              .filter(Boolean),
            potentialParallelizationGain: `${independentChildren.length}x speedup`
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Detect redundant nodes
   */
  detectRedundancies(nodes, edges) {
    const redundancies = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Check for duplicate nodes with same configuration
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        if (node1.type === node2.type &&
            JSON.stringify(node1.config) === JSON.stringify(node2.config)) {
          redundancies.push({
            nodes: [node1.name, node2.name],
            type: node1.type,
            recommendation: 'Merge these nodes or use results from first execution'
          });
        }
      }
    }

    return redundancies;
  }

  /**
   * Optimize workflow for schedule
   */
  optimizeForSchedule(workflowId, executions) {
    // Analyze execution times and suggest optimal schedule
    const executionTimes = executions
      .map(e => ({
        time: new Date(e.created_at),
        duration: e.duration
      }))
      .sort((a, b) => a.time - b.time);

    if (executionTimes.length < 5) {
      return null; // Not enough data
    }

    // Find patterns
    const timeSlots = new Map();
    for (const exec of executionTimes) {
      const hour = exec.time.getHours();
      const slot = `${hour}:00`;
      if (!timeSlots.has(slot)) {
        timeSlots.set(slot, []);
      }
      timeSlots.get(slot).push(exec.duration);
    }

    // Find optimal time slot
    let optimalSlot = null;
    let minAvgDuration = Infinity;

    for (const [slot, durations] of timeSlots) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avgDuration < minAvgDuration) {
        minAvgDuration = avgDuration;
        optimalSlot = slot;
      }
    }

    if (optimalSlot) {
      return {
        type: 'schedule',
        priority: 'medium',
        title: 'Optimize Execution Schedule',
        description: `Workflow runs faster at ${optimalSlot} UTC`,
        details: {
          optimalTime: optimalSlot,
          currentAverageDuration: Math.round(
            executionTimes.reduce((sum, e) => sum + e.duration, 0) / executionTimes.length
          ),
          optimizedAverageDuration: Math.round(minAvgDuration)
        },
        estimatedImprovement: `${Math.round(
          ((minAvgDuration - minAvgDuration) / minAvgDuration) * 100
        )}%`
      };
    }

    return null;
  }

  /**
   * Get node performance metrics
   */
  getNodePerformanceMetrics(nodes, executions) {
    const metrics = {};

    for (const node of nodes) {
      metrics[node.id] = {
        averageDuration: 0,
        executionCount: 0,
        failureCount: 0
      };
    }

    // This would be populated from execution traces
    return metrics;
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(stats, bottlenecks) {
    let riskScore = 0;

    // Factor: Success rate (lower = higher risk)
    riskScore += (100 - stats.successRate) * 0.3;

    // Factor: Bottlenecks (more = higher risk)
    riskScore += Math.min(bottlenecks.length * 10, 30);

    // Factor: Duration variance
    const durationVariance = stats.maxDuration - stats.minDuration;
    riskScore += Math.min(durationVariance / stats.averageDuration * 10, 20);

    return Math.round(Math.min(riskScore, 100));
  }

  /**
   * Get workflow executions
   */
  getWorkflowExecutions(workflowId, limit) {
    return this.db.prepare(
      `SELECT * FROM workflow_executions 
       WHERE workflow_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    ).all(workflowId, limit);
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(workflowId) {
    const analysis = this.analyzeWorkflow(workflowId);

    return {
      workflowId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSuggestions: analysis.suggestions.length,
        criticalIssues: analysis.suggestions.filter(s => s.priority === 'high').length,
        potentialTimelineSavings: analysis.suggestions
          .reduce((sum, s) => sum + (parseInt(s.estimatedImprovement) || 0), 0)
      },
      recommendations: analysis.suggestions.map((s, idx) => ({
        priority: idx + 1,
        ...s
      }))
    };
  }
}

module.exports = ProcessOptimizer;
