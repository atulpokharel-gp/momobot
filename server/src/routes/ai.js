const express = require('express')
const router = express.Router()
const aiService = require('../services/aiService')
const db = require('../db/database')
const logger = require('../logger')

// GET AI Task Recommendations
router.post('/think', async (req, res) => {
  try {
    const { model, taskType, description, capabilities } = req.body

    if (!model || !taskType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: model, taskType, description'
      })
    }

    logger.info(`AI Analysis requested: ${model} for ${taskType}`)

    const result = await aiService.generateThinking(
      model,
      taskType,
      description,
      capabilities || []
    )

    res.json({
      success: true,
      thinking: result.thinking,
      model: result.model,
      provider: result.provider,
      tokens: result.tokens || 'unknown',
      isFree: result.isFree || false
    })
  } catch (err) {
    logger.error('AI thinking error:', err.message)
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI thinking',
      error: err.message
    })
  }
})

// GET Available AI Models
router.get('/models', (req, res) => {
  const models = [
    {
      id: 'claude-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      type: 'premium',
      costPerMTok: 15,
      available: !!process.env.ANTHROPIC_API_KEY
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4O',
      provider: 'OpenAI',
      type: 'premium',
      costPerMTok: 30,
      available: !!process.env.OPENAI_API_KEY
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      type: 'premium',
      costPerMTok: 10,
      available: !!process.env.OPENAI_API_KEY
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      type: 'standard',
      costPerMTok: 0.5,
      available: !!process.env.OPENAI_API_KEY
    },
    {
      id: 'llama-2',
      name: 'Llama 2 (70B)',
      provider: 'Meta',
      type: 'free',
      costPerMTok: 0,
      available: true
    },
    {
      id: 'mistral-7b',
      name: 'Mistral 7B',
      provider: 'Mistral AI',
      type: 'free',
      costPerMTok: 0,
      available: true
    }
  ]

  res.json({
    success: true,
    models,
    totalAvailable: models.filter(m => m.available).length
  })
})

// POST Generate Workflow
router.post('/workflow/generate', (req, res) => {
  try {
    const { taskType, params, description } = req.body

    if (!taskType) {
      return res.status(400).json({
        success: false,
        message: 'taskType is required'
      })
    }

    const workflow = aiService.generateWorkflowJSON(taskType, params || {}, description || '')

    res.json({
      success: true,
      workflow,
      n8nFormat: JSON.stringify(workflow, null, 2)
    })
  } catch (err) {
    logger.error('Workflow generation error:', err.message)
    res.status(500).json({
      success: false,
      message: 'Failed to generate workflow',
      error: err.message
    })
  }
})

// GET Workflow Templates
router.get('/workflow/templates', (req, res) => {
  const templates = {
    system_monitoring: {
      name: 'System Monitoring',
      description: 'Monitor system resources and processes',
      tasks: ['system_info', 'process_list'],
      schedule: 'every 5 minutes'
    },
    file_automation: {
      name: 'File Automation',
      description: 'Automate file operations',
      tasks: ['file_read', 'file_write'],
      schedule: 'on-demand'
    },
    email_workflow: {
      name: 'Email Monitoring',
      description: 'Monitor emails and take actions',
      tasks: ['email_check'],
      schedule: 'every minute'
    },
    shell_automation: {
      name: 'Shell Command Execution',
      description: 'Execute shell commands and capture output',
      tasks: ['shell'],
      schedule: 'on-demand'
    },
    security_snapshot: {
      name: 'Security Snapshot',
      description: 'Take screenshots and check system state',
      tasks: ['screenshot', 'system_info', 'process_list'],
      schedule: 'hourly'
    }
  }

  res.json({
    success: true,
    templates,
    count: Object.keys(templates).length
  })
})

module.exports = router
