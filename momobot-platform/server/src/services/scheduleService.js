const cron = require('node-cron')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../db/database')
const logger = require('../logger')

class ScheduleService {
  constructor() {
    this.activeSchedules = new Map()
    this.taskQueue = []
    this.initializeActiveSchedules()
  }

  /**
   * Initialize active schedules from database on startup
   */
  initializeActiveSchedules() {
    try {
      const db = getDB()
      const schedules = db.prepare('SELECT * FROM schedules WHERE status = ?').all('active')

      schedules.forEach(schedule => {
        this.startSchedule(schedule.id)
      })

      logger.info(`Loaded ${schedules.length} active schedules from database`)
    } catch (err) {
      logger.error('Failed to load schedules from database:', err.message)
    }
  }

  /**
   * Create a new schedule
   * @param {Object} schedule - Schedule config
   * @returns {Object} Created schedule
   */
  createSchedule(schedule) {
    const {
      name,
      description,
      cronExpression,
      taskId,
      workflowId,
      estimatedDuration = 300,
      userId
    } = schedule

    // Validate cron expression
    if (!this.isValidCron(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`)
    }

    // Must have either task_id or workflow_id
    if (!taskId && !workflowId) {
      throw new Error('Must provide either taskId or workflowId')
    }

    const db = getDB()
    const scheduleId = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO schedules (
        id, name, description, cron_expression, task_id, workflow_id, 
        estimated_duration, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).run(
      scheduleId,
      name,
      description,
      cronExpression,
      taskId || null,
      workflowId || null,
      estimatedDuration,
      userId,
      now,
      now
    )

    logger.info(`Schedule created: ${scheduleId} - ${name}`)

    // Start the schedule immediately
    this.startSchedule(scheduleId)

    return this.getSchedule(scheduleId)
  }

  /**
   * Start a schedule (activate cron job)
   */
  startSchedule(scheduleId) {
    if (this.activeSchedules.has(scheduleId)) {
      return { message: 'Schedule already running' }
    }

    const db = getDB()
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId)

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    try {
      // Create cron job
      const task = cron.schedule(schedule.cron_expression, async () => {
        await this.executeScheduledTask(schedule)
      })

      this.activeSchedules.set(scheduleId, task)

      // Update database
      db.prepare('UPDATE schedules SET status = ? WHERE id = ?').run('active', scheduleId)

      logger.info(`Schedule started: ${schedule.name}`)

      return { success: true, message: 'Schedule started' }
    } catch (err) {
      logger.error(`Failed to start schedule ${scheduleId}:`, err.message)
      throw err
    }
  }

  /**
   * Stop a schedule (deactivate cron job)
   */
  stopSchedule(scheduleId) {
    const task = this.activeSchedules.get(scheduleId)

    if (task) {
      task.stop()
      this.activeSchedules.delete(scheduleId)
    }

    const db = getDB()
    db.prepare('UPDATE schedules SET status = ? WHERE id = ?').run('paused', scheduleId)

    logger.info(`Schedule stopped: ${scheduleId}`)

    return { success: true, message: 'Schedule stopped' }
  }

  /**
   * Execute a scheduled task
   */
  async executeScheduledTask(schedule) {
    const db = getDB()
    const executionId = uuidv4()
    const now = new Date().toISOString()

    try {
      if (logger) {
        logger.info(`⏰ Executing scheduled task: ${schedule.name}`)
      }

      // Record execution
      db.prepare(`
        INSERT INTO schedule_executions (
          id, schedule_id, status, executed_at
        ) VALUES (?, ?, 'running', ?)
      `).run(executionId, schedule.id, now)

      // Try to dispatch to agent via socket (handled by WebSocket service)
      // For now, just mark as completed
      db.prepare(`
        UPDATE schedule_executions SET status = 'completed' WHERE id = ?
      `).run(executionId)

      if (logger) {
        logger.info(`✅ Scheduled task executed: ${schedule.name}`)
      }
    } catch (err) {
      if (logger) {
        logger.error(`Failed to execute scheduled task:`, err.message)
      }

      db.prepare(`
        UPDATE schedule_executions SET status = 'failed', error = ? WHERE id = ?
      `).run(err.message, executionId)
    }
  }

  /**
   * Execute a scheduled task
   */
  async executeScheduledTask(schedule) {
    const db = getDB()
    const executionId = uuidv4()
    const now = new Date().toISOString()

    try {
      if (logger) {
        logger.info(`⏰ Executing scheduled task: ${schedule.name}`)
      }

      // Record execution
      db.prepare(`
        INSERT INTO schedule_executions (
          id, schedule_id, status, executed_at
        ) VALUES (?, ?, 'running', ?)
      `).run(executionId, schedule.id, now)

      // Try to dispatch to agent via socket (handled by WebSocket service)
      // For now, just mark as completed
      db.prepare(`
        UPDATE schedule_executions SET status = 'completed' WHERE id = ?
      `).run(executionId)

      if (logger) {
        logger.info(`✅ Scheduled task executed: ${schedule.name}`)
      }
    } catch (err) {
      if (logger) {
        logger.error(`Failed to execute scheduled task:`, err.message)
      }

      db.prepare(`
        UPDATE schedule_executions SET status = 'failed', error = ? WHERE id = ?
      `).run(err.message, executionId)
    }
  }

  /**
   * Check if cron expression is valid
   */
  isValidCron(expression) {
    try {
      cron.validate(expression)
      return true
    } catch (_) {
      return false
    }
  }

  /**
   * Get schedule by ID
   */
  getSchedule(scheduleId) {
    const db = getDB()
    return db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId)
  }

  /**
   * Get all user's schedules
   */
  getUserSchedules(userId) {
    const db = getDB()
    return db.prepare('SELECT * FROM schedules WHERE created_by = ? ORDER BY created_at DESC').all(userId)
  }

  /**
   * Get schedule executions
   */
  getScheduleExecutions(scheduleId, limit = 50) {
    const db = getDB()
    return db.prepare(`
      SELECT * FROM schedule_executions 
      WHERE schedule_id = ? 
      ORDER BY executed_at DESC 
      LIMIT ?
    `).all(scheduleId, limit)
  }

  /**
   * Update schedule
   */
  updateSchedule(scheduleId, updates) {
    const db = getDB()
    const allowedFields = ['name', 'description', 'cron_expression', 'estimated_duration']
    const setClause = allowedFields
      .filter(field => field in updates)
      .map(field => `${field} = ?`)
      .join(', ')

    if (!setClause) {
      throw new Error('No valid fields to update')
    }

    const values = allowedFields
      .filter(field => field in updates)
      .map(field => updates[field])

    values.push(new Date().toISOString())
    values.push(scheduleId)

    db.prepare(`
      UPDATE schedules SET ${setClause}, updated_at = ? WHERE id = ?
    `).run(...values)

    return this.getSchedule(scheduleId)
  }

  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId) {
    this.stopSchedule(scheduleId)

    const db = getDB()
    db.prepare('DELETE FROM schedules WHERE id = ?').run(scheduleId)

    logger.info(`Schedule deleted: ${scheduleId}`)

    return { success: true }
  }

  /**
   * Get schedule status
   */
  getScheduleStatus(scheduleId) {
    const db = getDB()
    const schedule = this.getSchedule(scheduleId)
    const executions = this.getScheduleExecutions(scheduleId, 10)

    return {
      schedule,
      isActive: this.activeSchedules.has(scheduleId),
      recentExecutions: executions
    }
  }

  /**
   * Common cron expressions for easy reference
   */
  static COMMON_CRONS = {
    'Every minute': '* * * * *',
    'Every 5 minutes': '*/5 * * * *',
    'Every 15 minutes': '*/15 * * * *',
    'Every hour': '0 * * * *',
    'Every day at 9:00 AM': '0 9 * * *',
    'Every day at 12:00 PM': '0 12 * * *',
    'Every day at 6:00 PM': '0 18 * * *',
    'Every day at 9:00 PM': '0 21 * * *',
    'Every Monday at 9:00 AM': '0 9 * * 1',
    'Every Friday at 5:00 PM': '0 17 * * 5',
    'Every Sunday at 12:00 AM': '0 0 * * 0',
    'First day of month at 9:00 AM': '0 9 1 * *'
  }
}

module.exports = new ScheduleService();

