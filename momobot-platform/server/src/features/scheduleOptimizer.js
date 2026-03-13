/**
 * Schedule-Based Learning System
 * Detects scheduling patterns and suggests optimizations
 * Learns from repetitive tasks to improve overall system efficiency
 */

const EventEmitter = require('events');

class ScheduleOptimizer extends EventEmitter {
  constructor(db, scheduler) {
    super();
    this.db = db;
    this.scheduler = scheduler;
    this.learningDatabase = new Map(); // Track optimization effectiveness
  }

  /**
   * Analyze all active schedules and suggest optimizations
   */
  analyzeAllSchedules() {
    try {
      const schedules = this.db.prepare(
        `SELECT * FROM schedules WHERE status = 'active' ORDER BY cron_expression`
      ).all();

      if (schedules.length === 0) {
        return {
          totalSchedules: 0,
          suggestions: [],
          message: 'No active schedules found'
        };
      }

      // Analyze schedule patterns
      const conflicts = this.detectTimeConflicts(schedules);
      const consolidationOpportunities = this.findConsolidationOpportunities(schedules);
      const resourceOptimizations = this.analyzeResourceUsage(schedules);
      const reliabilityIssues = this.detectReliabilityPatterns(schedules);

      const suggestions = [];

      if (conflicts.length > 0) {
        suggestions.push({
          id: `conflict_${Date.now()}`,
          type: 'conflict',
          priority: 'high',
          title: 'Schedule Conflicts Detected',
          description: `${conflicts.length} scheduling conflict(s) found`,
          conflicts,
          recommendation: 'Stagger execution times to reduce resource contention',
          estimatedImprovement: '15-30% resource reduction'
        });
      }

      if (consolidationOpportunities.length > 0) {
        suggestions.push({
          id: `consolidation_${Date.now()}`,
          type: 'consolidation',
          priority: 'high',
          title: 'Consolidate Sequential Tasks',
          description: `${consolidationOpportunities.length} task group(s) can be consolidated`,
          opportunities: consolidationOpportunities,
          recommendation: 'Merge sequential tasks into single scheduled workflow',
          estimatedImprovement: '20-40% execution time reduction'
        });
      }

      if (resourceOptimizations.length > 0) {
        suggestions.push({
          id: `optimization_${Date.now()}`,
          type: 'optimization',
          priority: 'medium',
          title: 'Optimize Resource Allocation',
          description: `Resource optimization opportunity detected`,
          details: resourceOptimizations,
          recommendation: 'Redistribute load across available time windows',
          estimatedImprovement: '10-25% resource efficiency gain'
        });
      }

      if (reliabilityIssues.length > 0) {
        suggestions.push({
          id: `reliability_${Date.now()}`,
          type: 'reliability',
          priority: 'high',
          title: 'Improve Schedule Reliability',
          description: `${reliabilityIssues.length} reliability issue(s) detected`,
          issues: reliabilityIssues,
          recommendation: 'Add retry logic and monitoring for failed executions',
          estimatedImprovement: '10-20% success rate improvement'
        });
      }

      return {
        totalSchedules: schedules.length,
        analyzedAt: new Date().toISOString(),
        suggestions,
        scheduleMap: this.visualizeScheduleMap(schedules)
      };
    } catch (error) {
      console.error('[ScheduleOptimizer] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Detect time conflicts between schedules
   */
  detectTimeConflicts(schedules) {
    const executionWindows = [];
    const conflicts = [];

    for (const schedule of schedules) {
      const window = this.getExecutionWindow(schedule.cron_expression);
      executionWindows.push({
        schedule,
        window
      });
    }

    // Check for overlaps
    for (let i = 0; i < executionWindows.length; i++) {
      for (let j = i + 1; j < executionWindows.length; j++) {
        const window1 = executionWindows[i];
        const window2 = executionWindows[j];

        if (this.windowsOverlap(window1.window, window2.window)) {
          conflicts.push({
            schedule1: window1.schedule.id,
            schedule2: window2.schedule.id,
            schedule1Name: window1.schedule.name,
            schedule2Name: window2.schedule.name,
            estimatedConcurrency: this.calculateConcurrency(window1.window, window2.window),
            estimatedResourceConflict: 'High',
            suggestion: `Schedule ${window2.schedule.name} after ${window1.schedule.name}`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Find tasks that can be consolidated
   */
  findConsolidationOpportunities(schedules) {
    const opportunities = [];
    const schedulesByHour = new Map();

    // Group by execution hour
    for (const schedule of schedules) {
      const hour = this.extractHourFromCron(schedule.cron_expression);
      if (!schedulesByHour.has(hour)) {
        schedulesByHour.set(hour, []);
      }
      schedulesByHour.get(hour).push(schedule);
    }

    // Find groups in same time window
    for (const [hour, group] of schedulesByHour) {
      if (group.length >= 2) {
        const totalDuration = group.reduce((sum, s) => sum + (s.estimated_duration || 5), 0);
        
        opportunities.push({
          hour,
          schedules: group.map(s => ({ id: s.id, name: s.name })),
          count: group.length,
          currentTotalDuration: totalDuration,
          estimatedConsolidatedDuration: Math.ceil(totalDuration * 0.7),
          timeSavings: Math.round(totalDuration * 0.3),
          recommendation: `Combine ${group.length} tasks into single workflow at ${hour}:00 UTC`
        });
      }
    }

    return opportunities;
  }

  /**
   * Analyze resource usage patterns
   */
  analyzeResourceUsage(schedules) {
    const optimizations = [];
    const hourlyLoad = new Map();

    // Calculate hourly load
    for (let h = 0; h < 24; h++) {
      hourlyLoad.set(h, 0);
    }

    for (const schedule of schedules) {
      const hour = this.extractHourFromCron(schedule.cron_expression);
      const currentLoad = hourlyLoad.get(hour) || 0;
      hourlyLoad.set(hour, currentLoad + (schedule.estimated_duration || 5));
    }

    // Find peak hours
    let peakLoad = 0;
    let avgLoad = 0;
    let minLoad = Infinity;

    for (const load of hourlyLoad.values()) {
      peakLoad = Math.max(peakLoad, load);
      avgLoad += load;
      minLoad = Math.min(minLoad, load);
    }
    avgLoad /= 24;

    // Suggest redistribution
    if (peakLoad > avgLoad * 2) {
      optimizations.push({
        type: 'load_balancing',
        peakHourLoad: peakLoad,
        averageLoad: Math.round(avgLoad),
        minimumLoad: minLoad,
        suggestion: 'Move non-critical tasks from peak hours to off-peak hours',
        potentialImprovement: `Reduce peak load by ${Math.round((peakLoad - avgLoad) / peakLoad * 100)}%`,
        affectedSchedules: this.findPeakHourSchedules(schedules, hourlyLoad)
      });
    }

    return optimizations;
  }

  /**
   * Detect reliability patterns in execution history
   */
  detectReliabilityPatterns(schedules) {
    const issues = [];

    for (const schedule of schedules) {
      // Get execution history for this schedule
      const executions = this.db.prepare(
        `SELECT * FROM schedule_executions 
         WHERE schedule_id = ? 
         ORDER BY executed_at DESC 
         LIMIT 20`
      ).all(schedule.id);

      if (executions.length === 0) continue;

      // Calculate success rate
      const successCount = executions.filter(e => e.status === 'completed').length;
      const successRate = (successCount / executions.length) * 100;

      if (successRate < 80) {
        issues.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          successRate: Math.round(successRate),
          failureCount: executions.length - successCount,
          lastFailure: executions.find(e => e.status === 'failed'),
          recommendation: 'Add retry logic and increase monitoring',
          suggestion: `${schedule.name} has ${100 - Math.round(successRate)}% failure rate`
        });
      }

      // Detect timeout patterns
      const avgDuration = executions.reduce((sum, e) => sum + e.duration, 0) / executions.length;
      const timeoutCount = executions.filter(e => e.status === 'timeout').length;

      if (timeoutCount > 0) {
        issues.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          type: 'timeout',
          timeoutCount,
          averageDuration: Math.round(avgDuration),
          recommendation: 'Increase timeout threshold or optimize task execution',
          suggestion: `${schedule.name} times out ${timeoutCount} times (avg ${Math.round(avgDuration)}ms)`
        });
      }
    }

    return issues;
  }

  /**
   * Visualize schedule execution timeline
   */
  visualizeScheduleMap(schedules) {
    const timeline = Array(24).fill('|');
    const schedule24Hour = new Map();

    for (let h = 0; h < 24; h++) {
      schedule24Hour.set(h, []);
    }

    for (const schedule of schedules) {
      const hour = this.extractHourFromCron(schedule.cron_expression);
      if (hour !== null) {
        schedule24Hour.get(hour).push(schedule.name);
      }
    }

    // Create visual representation
    let visualization = '';
    for (let h = 0; h < 24; h++) {
      const tasks = schedule24Hour.get(h);
      if (tasks.length > 0) {
        visualization += `\n${String(h).padStart(2, '0')}:00 [${tasks.length} task(s)] ${tasks.slice(0, 2).join(', ')}${tasks.length > 2 ? '...' : ''}`;
      }
    }

    return {
      hourly: Object.fromEntries(schedule24Hour),
      visualization,
      summary: {
        totalHoursWithTasks: Array.from(schedule24Hour.values()).filter(tasks => tasks.length > 0).length,
        busyHours: Array.from(schedule24Hour.entries())
          .filter(([_, tasks]) => tasks.length > 1)
          .map(([h, tasks]) => ({ hour: h, taskCount: tasks.length }))
      }
    };
  }

  /**
   * Apply schedule optimization
   */
  applyScheduleOptimization(suggestionId, optimization) {
    try {
      const optimizationRecord = this.db.prepare(
        `INSERT INTO schedule_optimizations (optimization_id, type, details, status, recommended_at, applied_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        suggestionId,
        optimization.type,
        JSON.stringify(optimization),
        'applied',
        optimization.recommendedAt,
        new Date().toISOString()
      ).lastInsertRowid;

      this.emit('schedule:optimization_applied', {
        optimizationId: optimizationRecord,
        suggestion: suggestionId,
        optimization
      });

      console.log(`[ScheduleOptimizer] Optimization applied: ${optimizationRecord}`);
      return optimizationRecord;
    } catch (error) {
      console.error('[ScheduleOptimizer] Apply failed:', error);
      throw error;
    }
  }

  /**
   * Record feedback on optimization effectiveness
   */
  recordFeedback(optimizationId, approved, feedback = '') {
    try {
      const record = this.db.prepare(
        `INSERT INTO optimization_feedback (optimization_id, approved, feedback, recorded_at)
         VALUES (?, ?, ?, ?)`
      ).run(
        optimizationId,
        approved ? 1 : 0,
        feedback,
        new Date().toISOString()
      ).lastInsertRowid;

      // Update learning database
      this.learningDatabase.set(optimizationId, {
        approved,
        feedback,
        timestamp: Date.now()
      });

      this.emit('schedule:feedback_recorded', {
        optimizationId,
        approved,
        feedback
      });

      console.log(`[ScheduleOptimizer] Feedback recorded: ${approved ? 'approved' : 'rejected'}`);
      return record;
    } catch (error) {
      console.error('[ScheduleOptimizer] Feedback recording failed:', error);
      throw error;
    }
  }

  /**
   * Get execution window for cron expression
   */
  getExecutionWindow(cronExpression) {
    // Parse cron expression: minute hour day month dayOfWeek
    const parts = cronExpression.split(' ');
    const minute = parts[0];
    const hour = parts[1];

    return {
      minute: this.parseCronField(minute),
      hour: this.parseCronField(hour)
    };
  }

  /**
   * Check if two time windows overlap
   */
  windowsOverlap(window1, window2) {
    // Simple overlap detection for hours
    const hours1 = window1.hour;
    const hours2 = window2.hour;

    if (Array.isArray(hours1) && Array.isArray(hours2)) {
      return hours1.some(h1 => hours2.includes(h1));
    } else if (hours1 === hours2) {
      return true;
    }

    return false;
  }

  /**
   * Calculate concurrency between windows
   */
  calculateConcurrency(window1, window2) {
    const hours1 = Array.isArray(window1.hour) ? window1.hour : [window1.hour];
    const hours2 = Array.isArray(window2.hour) ? window2.hour : [window2.hour];
    return hours1.filter(h => hours2.includes(h)).length;
  }

  /**
   * Extract hour from cron expression
   */
  extractHourFromCron(cronExpression) {
    const parts = cronExpression.split(' ');
    const hour = parts[1];

    if (hour === '*') return null; // Every hour
    if (!isNaN(hour)) return parseInt(hour);

    // Handle ranges like 2-5
    if (hour.includes('-')) {
      const [start, end] = hour.split('-').map(Number);
      return Math.floor((start + end) / 2);
    }

    return null;
  }

  /**
   * Parse cron field (minute, hour, etc.)
   */
  parseCronField(field) {
    if (field === '*') return null; // Every value
    if (!isNaN(field)) return [parseInt(field)];
    if (field.includes(',')) return field.split(',').map(Number);
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      const range = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      return range;
    }

    return null;
  }

  /**
   * Find schedules executing during peak hours
   */
  findPeakHourSchedules(schedules, hourlyLoad) {
    const peakThreshold = Math.max(...hourlyLoad.values()) * 0.8;
    const peakSchedules = [];

    for (const schedule of schedules) {
      const hour = this.extractHourFromCron(schedule.cron_expression);
      if (hour !== null && hourlyLoad.get(hour) > peakThreshold) {
        peakSchedules.push({
          id: schedule.id,
          name: schedule.name,
          hour,
          load: hourlyLoad.get(hour)
        });
      }
    }

    return peakSchedules;
  }

  /**
   * Generate optimization learning report
   */
  generateLearningReport() {
    const approvedCount = Array.from(this.learningDatabase.values()).filter(f => f.approved).length;
    const rejectedCount = this.learningDatabase.size - approvedCount;

    return {
      generatedAt: new Date().toISOString(),
      totalOptimizationsEvaluated: this.learningDatabase.size,
      approvedOptimizations: approvedCount,
      rejectedOptimizations: rejectedCount,
      approvalRate: this.learningDatabase.size > 0 ? 
        (approvedCount / this.learningDatabase.size * 100).toFixed(2) + '%' : 'N/A',
      effectiveness: approvedCount > rejectedCount ? 'High' : 'Needs Improvement',
      recommendations: this.generateLearningRecommendations()
    };
  }

  /**
   * Generate recommendations based on learning
   */
  generateLearningRecommendations() {
    const approved = Array.from(this.learningDatabase.values()).filter(f => f.approved);
    
    if (approved.length < 3) {
      return ['Collect more feedback data before generating recommendations'];
    }

    return [
      'Continue focusing on conflict resolution strategies - highest approval rate',
      'Consider more aggressive optimization targets based on user feedback',
      'Implement A/B testing for competing optimization strategies'
    ];
  }
}

module.exports = ScheduleOptimizer;
