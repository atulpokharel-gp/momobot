/**
 * Workflow Optimization API Routes
 * Provides endpoints for AI-driven workflow and schedule optimization
 */

const express = require('express');
const ProcessOptimizer = require('../features/processOptimizer');
const ScheduleOptimizer = require('../features/scheduleOptimizer');
const { authenticate } = require('../middleware/auth');

function setupOptimizationRoutes(db, scheduler, EventEmitter) {
  const router = express.Router();
  const processOptimizer = new ProcessOptimizer(db);
  const scheduleOptimizer = new ScheduleOptimizer(db, scheduler);

  /**
   * Analyze workflow for optimization opportunities
   */
  router.post('/workflows/:id/analyze', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const analysis = processOptimizer.analyzeWorkflow(id);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Get optimization report for workflow
   */
  router.get('/workflows/:id/optimization-report', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const report = processOptimizer.generateOptimizationReport(id);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Apply workflow optimization
   */
  router.post('/workflows/:id/optimizations/:optimizationId/apply', authenticate, (req, res) => {
    try {
      const { id, optimizationId } = req.params;
      const requestId = processOptimizer.applyOptimization(id, optimizationId);

      res.json({
        success: true,
        optimizationRequestId: requestId,
        message: 'Optimization request created and pending approval'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Analyze all schedules for optimization
   */
  router.get('/schedules/analyze', authenticate, (req, res) => {
    try {
      const analysis = scheduleOptimizer.analyzeAllSchedules();

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Get schedule visualization
   */
  router.get('/schedules/visualization', authenticate, (req, res) => {
    try {
      const schedules = db.prepare(
        `SELECT * FROM schedules WHERE status = 'active'`
      ).all();

      const visualization = scheduleOptimizer.visualizeScheduleMap(schedules);

      res.json({
        success: true,
        data: visualization
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Apply schedule optimization
   */
  router.post('/schedules/optimizations/:suggestionId/apply', authenticate, (req, res) => {
    try {
      const { suggestionId } = req.params;
      const { optimization } = req.body;

      if (!optimization) {
        return res.status(400).json({
          success: false,
          error: 'Optimization details required'
        });
      }

      const optimizationId = scheduleOptimizer.applyScheduleOptimization(
        suggestionId,
        optimization
      );

      res.json({
        success: true,
        optimizationId,
        message: 'Schedule optimization applied'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Record optimization feedback
   */
  router.post('/optimizations/:optimizationId/feedback', authenticate, (req, res) => {
    try {
      const { optimizationId } = req.params;
      const { approved, feedback } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Approved status required (true/false)'
        });
      }

      const feedbackId = scheduleOptimizer.recordFeedback(
        optimizationId,
        approved,
        feedback
      );

      res.json({
        success: true,
        feedbackId,
        message: `Optimization ${approved ? 'approved' : 'rejected'}`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Get learning report
   */
  router.get('/optimizations/learning/report', authenticate, (req, res) => {
    try {
      const report = scheduleOptimizer.generateLearningReport();

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Compare workflow optimizations
   */
  router.post('/workflows/compare-optimizations', authenticate, (req, res) => {
    try {
      const { workflowIds } = req.body;

      if (!Array.isArray(workflowIds) || workflowIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'workflowIds array required'
        });
      }

      const comparisons = workflowIds.map(id => {
        const analysis = processOptimizer.analyzeWorkflow(id);
        return {
          workflowId: id,
          riskScore: analysis.overallRiskScore,
          suggestionCount: analysis.suggestions.length,
          topPriority: analysis.suggestions[0]?.priority || 'N/A',
          estimatedImprovement: analysis.suggestions[0]?.estimatedImprovement || 'N/A'
        };
      });

      // Sort by risk score (highest risk first)
      comparisons.sort((a, b) => b.riskScore - a.riskScore);

      res.json({
        success: true,
        data: {
          comparison: comparisons,
          recommendation: comparisons[0]?.workflowId ? 
            `${comparisons[0].workflowId} needs immediate attention (Risk: ${comparisons[0].riskScore}/100)` : 
            'All workflows optimized'
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Get optimization status dashboard
   */
  router.get('/optimizations/dashboard', authenticate, (req, res) => {
    try {
      const allSchedules = db.prepare(
        `SELECT * FROM schedules WHERE status = 'active'`
      ).all();

      const scheduleAnalysis = scheduleOptimizer.analyzeAllSchedules();
      
      const pendingOptimizations = db.prepare(
        `SELECT COUNT(*) as count FROM workflow_optimizations WHERE status = 'pending'`
      ).get().count;

      const appliedOptimizations = db.prepare(
        `SELECT COUNT(*) as count FROM workflow_optimizations WHERE status = 'applied'`
      ).get().count;

      const learningReport = scheduleOptimizer.generateLearningReport();

      res.json({
        success: true,
        data: {
          overview: {
            activeSchedules: allSchedules.length,
            pendingOptimizations,
            appliedOptimizations,
            learningEffectiveness: learningReport.effectiveness
          },
          scheduleHealth: {
            totalConflicts: scheduleAnalysis.suggestions.filter(s => s.type === 'conflict').length,
            consolidationOpportunities: scheduleAnalysis.suggestions.filter(s => s.type === 'consolidation').length,
            reliabilityIssues: scheduleAnalysis.suggestions.filter(s => s.type === 'reliability').length
          },
          recommendations: scheduleAnalysis.suggestions.slice(0, 5),
          learningMetrics: {
            totalEvaluated: learningReport.totalOptimizationsEvaluated,
            approvalRate: learningReport.approvalRate,
            recommendations: learningReport.recommendations
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Get optimization suggestions for workflow
   */
  router.get('/workflows/:id/suggestions', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const analysis = processOptimizer.analyzeWorkflow(id);

      res.json({
        success: true,
        data: {
          workflowId: id,
          totalSuggestions: analysis.suggestions.length,
          suggestions: analysis.suggestions.map((s, idx) => ({
            id: idx,
            ...s
          }))
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = setupOptimizationRoutes;
