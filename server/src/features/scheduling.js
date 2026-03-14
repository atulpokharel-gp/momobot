/**
 * Advanced Task Scheduling & Cron Support
 * Enables recurring tasks, scheduled executions, and cron-based automation
 */

const cron = require('node-cron');
const { EventEmitter } = require('events');

class TaskScheduler extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.jobs = new Map();
    this.initialized = false;
  }

  /**
   * Initialize scheduler and load persisted schedules from database
   */
  async initialize() {
    try {
      // Load all active schedules from database
      const schedules = this.db.prepare(
        `SELECT id, task_id, cron_expression, enabled, device_id, last_run_at
         FROM task_schedules WHERE enabled = 1`
      ).all();

      schedules.forEach(schedule => {
        this.createCronJob(schedule);
      });

      this.initialized = true;
      console.log(`[Scheduler] Initialized with ${schedules.length} active schedules`);
    } catch (error) {
      console.error('[Scheduler] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a cron job for a given schedule
   */
  createCronJob(schedule) {
    try {
      // Validate cron expression
      if (!cron.validate(schedule.cron_expression)) {
        throw new Error(`Invalid cron expression: ${schedule.cron_expression}`);
      }

      // Cancel existing job
      if (this.jobs.has(schedule.id)) {
        this.jobs.get(schedule.id).stop();
      }

      // Create new job
      const job = cron.schedule(schedule.cron_expression, () => {
        this.emit('task:execute', {
          schedule_id: schedule.id,
          task_id: schedule.task_id,
          device_id: schedule.device_id,
          timestamp: new Date()
        });

        // Update last_run_at
        this.db.prepare(
          `UPDATE task_schedules SET last_run_at = ? WHERE id = ?`
        ).run(new Date().toISOString(), schedule.id);
      });

      this.jobs.set(schedule.id, job);
      console.log(`[Scheduler] Created cron job for schedule ${schedule.id}`);
    } catch (error) {
      console.error(`[Scheduler] Failed to create job for schedule ${schedule.id}:`, error);
      this.emit('schedule:error', { schedule_id: schedule.id, error });
    }
  }

  /**
   * Schedule a new task
   */
  scheduleTask(taskId, cronExpression, deviceId, description) {
    try {
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      const scheduleId = this.db.prepare(
        `INSERT INTO task_schedules (task_id, cron_expression, device_id, description, enabled, created_at)
         VALUES (?, ?, ?, ?, 1, ?)`
      ).run(taskId, cronExpression, deviceId, description, new Date().toISOString()).lastInsertRowid;

      const schedule = this.db.prepare(
        `SELECT * FROM task_schedules WHERE id = ?`
      ).get(scheduleId);

      this.createCronJob(schedule);
      return schedule;
    } catch (error) {
      console.error('[Scheduler] Schedule failed:', error);
      throw error;
    }
  }

  /**
   * Pause a schedule
   */
  pauseSchedule(scheduleId) {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.stop();
      this.db.prepare(
        `UPDATE task_schedules SET enabled = 0 WHERE id = ?`
      ).run(scheduleId);
    }
  }

  /**
   * Resume a schedule
   */
  resumeSchedule(scheduleId) {
    const schedule = this.db.prepare(
      `SELECT * FROM task_schedules WHERE id = ?`
    ).get(scheduleId);

    if (schedule) {
      this.createCronJob(schedule);
      this.db.prepare(
        `UPDATE task_schedules SET enabled = 1 WHERE id = ?`
      ).run(scheduleId);
    }
  }

  /**
   * Get all schedules
   */
  getSchedules(deviceId = null) {
    const query = deviceId
      ? `SELECT * FROM task_schedules WHERE device_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM task_schedules ORDER BY created_at DESC`;

    return this.db.prepare(query).all(...(deviceId ? [deviceId] : []));
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId) {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.stop();
      this.jobs.delete(scheduleId);
    }
    this.db.prepare(`DELETE FROM task_schedules WHERE id = ?`).run(scheduleId);
  }

  /**
   * Shutdown scheduler
   */
  shutdown() {
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    console.log('[Scheduler] Shutdown complete');
  }
}

module.exports = TaskScheduler;
