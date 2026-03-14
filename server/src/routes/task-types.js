const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/task-types
 * Create a custom task type from workflow definition
 * Body: {
 *   type, name, description, icon, workflow_definition, agent_id?, created_by?
 * }
 */
router.post('/',
  authenticate,
  body('type').trim().notEmpty().matches(/^[a-z_]+$/),
  body('name').trim().notEmpty().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('icon').optional().isLength({ max: 5 }),
  body('workflow_definition').notEmpty().isObject(),
  body('agent_id').optional().isString(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, name, description, icon = '⚡', workflow_definition, agent_id } = req.body;
    const { id: userId } = req.user;
    const db = getDB();

    try {
      // Check if type already exists
      const existing = db.prepare(
        'SELECT id FROM custom_task_types WHERE type = ?'
      ).get(type);

      if (existing) {
        return res.status(409).json({
          error: 'Task type already exists',
          code: 'DUPLICATE_TASK_TYPE'
        });
      }

      // Validate agent if provided
      if (agent_id) {
        const agent = db.prepare(
          'SELECT id FROM agents WHERE id = ? AND is_active = 1'
        ).get(agent_id);

        if (!agent) {
          return res.status(404).json({
            error: 'Agent not found or not active'
          });
        }
      }

      const taskTypeId = uuidv4();
      const now = new Date().toISOString();

      // Insert custom task type
      const stmt = db.prepare(`
        INSERT INTO custom_task_types (
          id, type, name, description, icon, workflow_definition,
          agent_id, created_by, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        taskTypeId,
        type,
        name,
        description || null,
        icon,
        JSON.stringify(workflow_definition),
        agent_id || null,
        userId,
        now,
        now
      );

      // Return created task type
      const taskType = db.prepare(
        'SELECT * FROM custom_task_types WHERE id = ?'
      ).get(taskTypeId);

      return res.status(201).json({
        success: true,
        message: `Custom task type "${name}" created successfully`,
        taskTypeId,
        taskType: {
          ...taskType,
          workflow_definition: JSON.parse(taskType.workflow_definition)
        }
      });
    } catch (error) {
      console.error('[Task Types] Error creating custom task type:', error);
      return res.status(500).json({
        error: 'Failed to create task type',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/task-types/custom
 * Get all custom task types created by or available to current user
 */
router.get('/custom',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: userId } = req.user;
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    try {
      const db = getDB();

      // Get custom task types created by user
      const taskTypes = db.prepare(`
        SELECT 
          id, type, name, description, icon,
          agent_id, created_by, created_at, updated_at, usage_count
        FROM custom_task_types
        WHERE created_by = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset);

      // Get total count
      const { count } = db.prepare(
        'SELECT COUNT(*) as count FROM custom_task_types WHERE created_by = ?'
      ).get(userId);

      return res.json({
        success: true,
        taskTypes: taskTypes,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: offset + limit < count
        }
      });
    } catch (error) {
      console.error('[Task Types] Error fetching custom task types:', error);
      return res.status(500).json({
        error: 'Failed to fetch task types',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/task-types/custom/:id
 * Get single custom task type with full workflow definition
 */
router.get('/custom/:id',
  authenticate,
  (req, res) => {
    const { id } = req.params;

    try {
      const db = getDB();
      const taskType = db.prepare(
        'SELECT * FROM custom_task_types WHERE id = ?'
      ).get(id);

      if (!taskType) {
        return res.status(404).json({
          error: 'Task type not found'
        });
      }

      // Increment usage count
      db.prepare(
        'UPDATE custom_task_types SET usage_count = usage_count + 1 WHERE id = ?'
      ).run(id);

      return res.json({
        success: true,
        taskType: {
          ...taskType,
          workflow_definition: JSON.parse(taskType.workflow_definition)
        }
      });
    } catch (error) {
      console.error('[Task Types] Error fetching task type:', error);
      return res.status(500).json({
        error: 'Failed to fetch task type',
        details: error.message
      });
    }
  }
);

/**
 * DELETE /api/task-types/:id
 * Delete custom task type
 */
router.delete('/:id',
  authenticate,
  (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user;

    try {
      const db = getDB();

      // Verify ownership
      const taskType = db.prepare(
        'SELECT created_by FROM custom_task_types WHERE id = ?'
      ).get(id);

      if (!taskType) {
        return res.status(404).json({
          error: 'Task type not found'
        });
      }

      if (taskType.created_by !== userId) {
        return res.status(403).json({
          error: 'Not authorized to delete this task type'
        });
      }

      // Delete task type
      const result = db.prepare(
        'DELETE FROM custom_task_types WHERE id = ?'
      ).run(id);

      return res.json({
        success: true,
        message: 'Task type deleted successfully',
        deletedId: id
      });
    } catch (error) {
      console.error('[Task Types] Error deleting task type:', error);
      return res.status(500).json({
        error: 'Failed to delete task type',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/task-types/:id
 * Update custom task type
 */
router.put('/:id',
  authenticate,
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('icon').optional().isLength({ max: 5 }),
  body('workflow_definition').optional().isObject(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { id: userId } = req.user;
    const { name, description, icon, workflow_definition } = req.body;

    try {
      const db = getDB();

      // Verify ownership
      const taskType = db.prepare(
        'SELECT created_by FROM custom_task_types WHERE id = ?'
      ).get(id);

      if (!taskType) {
        return res.status(404).json({
          error: 'Task type not found'
        });
      }

      if (taskType.created_by !== userId) {
        return res.status(403).json({
          error: 'Not authorized to update this task type'
        });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description || null);
      }
      if (icon) {
        updates.push('icon = ?');
        values.push(icon);
      }
      if (workflow_definition) {
        updates.push('workflow_definition = ?');
        values.push(JSON.stringify(workflow_definition));
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No fields to update'
        });
      }

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const query = `UPDATE custom_task_types SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...values);

      // Get updated task type
      const updated = db.prepare(
        'SELECT * FROM custom_task_types WHERE id = ?'
      ).get(id);

      return res.json({
        success: true,
        message: 'Task type updated successfully',
        taskType: {
          ...updated,
          workflow_definition: JSON.parse(updated.workflow_definition)
        }
      });
    } catch (error) {
      console.error('[Task Types] Error updating task type:', error);
      return res.status(500).json({
        error: 'Failed to update task type',
        details: error.message
      });
    }
  }
);

module.exports = router;
