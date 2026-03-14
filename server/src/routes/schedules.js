const express = require('express')
const router = express.Router()
const ScheduleService = require('../services/scheduleService')

/**
 * POST /api/schedules - Create new schedule
 */
router.post('/', (req, res) => {
  try {
    const { name, description, cronExpression, taskId, workflowId, estimatedDuration } = req.body
    const userId = req.user?.id || req.headers['x-user-id']

    if (!name || !cronExpression) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, cronExpression'
      })
    }

    const schedule = ScheduleService.createSchedule({
      name,
      description,
      cronExpression,
      taskId,
      workflowId,
      estimatedDuration,
      userId
    })

    res.json({
      success: true,
      data: schedule,
      message: 'Schedule created and started'
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * GET /api/schedules - Get user's schedules
 */
router.get('/', (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id']

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID required'
      })
    }

    const schedules = ScheduleService.getUserSchedules(userId)

    res.json({
      success: true,
      data: schedules
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * GET /api/schedules/:id - Get schedule details
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const schedule = ScheduleService.getSchedule(id)

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      })
    }

    res.json({
      success: true,
      data: schedule
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * GET /api/schedules/:id/status - Get schedule status with recent executions
 */
router.get('/:id/status', (req, res) => {
  try {
    const { id } = req.params
    const status = ScheduleService.getScheduleStatus(id)

    res.json({
      success: true,
      data: status
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * GET /api/schedules/:id/executions - Get schedule executions
 */
router.get('/:id/executions', (req, res) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit) || 50

    const executions = ScheduleService.getScheduleExecutions(id, limit)

    res.json({
      success: true,
      data: executions
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * PUT /api/schedules/:id - Update schedule
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const { name, description, cronExpression, estimatedDuration } = req.body

    const schedule = ScheduleService.updateSchedule(id, {
      name,
      description,
      cron_expression: cronExpression,
      estimated_duration: estimatedDuration
    })

    res.json({
      success: true,
      data: schedule,
      message: 'Schedule updated'
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * POST /api/schedules/:id/start - Start schedule
 */
router.post('/:id/start', (req, res) => {
  try {
    const { id } = req.params
    const result = ScheduleService.startSchedule(id)

    res.json({
      success: true,
      data: result
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * POST /api/schedules/:id/stop - Stop schedule
 */
router.post('/:id/stop', (req, res) => {
  try {
    const { id } = req.params
    const result = ScheduleService.stopSchedule(id)

    res.json({
      success: true,
      data: result
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * DELETE /api/schedules/:id - Delete schedule
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const result = ScheduleService.deleteSchedule(id)

    res.json({
      success: true,
      data: result,
      message: 'Schedule deleted'
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

/**
 * GET /api/schedules/common/crons - Get common cron expressions
 */
router.get('/common/crons', (req, res) => {
  res.json({
    success: true,
    data: ScheduleService.constructor.COMMON_CRONS
  })
})

module.exports = router;
