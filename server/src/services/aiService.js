const axios = require('axios')
const logger = require('../logger')

class AIService {
  constructor() {
    this.apiKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY
    }
  }

  async generateThinking(model, taskType, description, capabilities) {
    try {
      let response

      if (model.startsWith('gpt')) {
        response = await this.callOpenAI(model, taskType, description, capabilities)
      } else if (model.startsWith('claude')) {
        response = await this.callAnthropic(model, taskType, description, capabilities)
      } else if (model.includes('llama') || model.includes('mistral')) {
        response = await this.callHuggingFace(model, taskType, description, capabilities)
      } else {
        response = await this.callLocalModel(model, taskType, description, capabilities)
      }

      return response
    } catch (err) {
      logger.error(`AI thinking error with ${model}:`, err.message)
      return this.generateFallbackThinking(taskType, description, capabilities)
    }
  }

  async callOpenAI(model, taskType, description, capabilities) {
    if (!this.apiKeys.openai) {
      return this.generateFallbackThinking(taskType, description, capabilities)
    }

    const systemPrompt = `You are an expert task automation assistant. Analyze the user's request and provide:
1. Step-by-step breakdown of what needs to be done
2. Recommended parameters for the ${taskType} task
3. Potential challenges and solutions
4. Estimated execution time

Be concise and practical.`

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Task Type: ${taskType}\nDescription: ${description}\nAvailable Parameters: ${capabilities.join(', ')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`,
        'Content-Type': 'application/json'
      }
    })

    return {
      thinking: response.data.choices[0].message.content,
      model,
      provider: 'OpenAI',
      tokens: response.data.usage.total_tokens
    }
  }

  async callAnthropic(model, taskType, description, capabilities) {
    if (!this.apiKeys.anthropic) {
      return this.generateFallbackThinking(taskType, description, capabilities)
    }

    const systemPrompt = `You are an expert task automation consultant. Analyze task requirements and provide:
1. Detailed action plan
2. Optimal parameter values
3. Risk assessment
4. Expected results

Keep response focused and actionable.`

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this automation task:\nType: ${taskType}\nDescription: ${description}\nCapabilities: ${capabilities.join(', ')}`
        }
      ]
    }, {
      headers: {
        'x-api-key': this.apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    })

    return {
      thinking: response.data.content[0].text,
      model,
      provider: 'Anthropic',
      tokens: response.data.usage.output_tokens
    }
  }

  async callHuggingFace(model, taskType, description, capabilities) {
    if (!this.apiKeys.huggingface) {
      return this.generateFallbackThinking(taskType, description, capabilities)
    }

    const prompt = `Task automation analysis:

Task Type: ${taskType}
Description: ${description}
Available Capabilities: ${capabilities.join(', ')}

Provide analysis in the following format:
1. Plan:
2. Parameters:
3. Risks:
4. Timeline:`

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_length: 500,
            temperature: 0.7
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKeys.huggingface}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        thinking: response.data[0].generated_text || this.generateFallbackThinking(taskType, description, capabilities).thinking,
        model,
        provider: 'HuggingFace',
        isFree: true
      }
    } catch (err) {
      logger.warn(`HuggingFace ${model} not available, using fallback`)
      return this.generateFallbackThinking(taskType, description, capabilities)
    }
  }

  async callLocalModel(model, taskType, description, capabilities) {
    // For local models like llama.cpp or ollama
    try {
      const localEndpoint = process.env.LOCAL_MODEL_ENDPOINT || 'http://localhost:11434/api/generate'

      const response = await axios.post(localEndpoint, {
        model,
        prompt: `Analyze this task:\nType: ${taskType}\nDescription: ${description}\nCapabilities: ${capabilities.join(', ')}`,
        stream: false
      })

      return {
        thinking: response.data.response,
        model,
        provider: 'Local',
        isFree: true
      }
    } catch (_) {
      return this.generateFallbackThinking(taskType, description, capabilities)
    }
  }

  generateFallbackThinking(taskType, description, capabilities) {
    const cap = {
      shell: 'Execute shell command',
      file_read: 'Read file content',
      file_write: 'Create/modify file',
      screenshot: 'Capture screen',
      system_info: 'Get system details',
      email_check: 'Check emails',
      process_list: 'List processes'
    }

    const thinking = `## Task Analysis: ${cap[taskType] || taskType}

### Objective
${description}

### Available Parameters
${capabilities.map(p => `- ${p}`).join('\n')}

### Recommended Approach
1. **Preparation**: Validate all required parameters
2. **Execution**: Execute the task with provided parameters
3. **Validation**: Verify task completed successfully
4. **Reporting**: Return results to admin

### Expected Outcome
The task will complete and return results to the admin portal for review and action.

### Time Estimate
~5-10 seconds for execution and result collection`

    return {
      thinking,
      model: 'fallback',
      provider: 'Built-in Assistant',
      isFree: true
    }
  }

  generateWorkflowJSON(taskType, params, description) {
    return {
      name: `${taskType} Workflow`,
      version: '1.0',
      description,
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          name: 'Manual Trigger',
          properties: {
            triggerType: 'manual'
          }
        },
        {
          id: 'task_node',
          type: 'action',
          name: taskType,
          properties: {
            taskType,
            parameters: params
          }
        },
        {
          id: 'response',
          type: 'response',
          name: 'Response',
          properties: {
            format: 'json'
          }
        }
      ],
      connections: [
        { source: 'trigger', target: 'task_node' },
        { source: 'task_node', target: 'response' }
      ]
    }
  }
}

module.exports = new AIService()
