import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  SparklesIcon, WrenchIcon, ChevronDownIcon,
  DocumentTextIcon, CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline'

const AGENT_CAPABILITIES = {
  shell: {
    name: '💻 Shell Command',
    description: 'Execute shell/terminal commands',
    icon: '💻',
    params: ['command', 'timeout', 'cwd']
  },
  file_read: {
    name: '📖 Read File',
    description: 'Read file contents',
    icon: '📖',
    params: ['path', 'encoding']
  },
  file_write: {
    name: '✍️ Write File',
    description: 'Write content to file',
    icon: '✍️',
    params: ['path', 'content', 'append']
  },
  screenshot: {
    name: '📸 Screenshot',
    description: 'Capture screen screenshot',
    icon: '📸',
    params: ['format', 'quality']
  },
  system_info: {
    name: '🖥️ System Info',
    description: 'Get system information',
    icon: '🖥️',
    params: []
  },
  email_check: {
    name: '📧 Check Email',
    description: 'Check emails in folder',
    icon: '📧',
    params: ['folder', 'max_results']
  },
  process_list: {
    name: '⚙️ Process List',
    description: 'List running processes',
    icon: '⚙️',
    params: ['filter']
  },
  browser_open: {
    name: '🌐 Open Browser',
    description: 'Open URL in default browser',
    icon: '🌐',
    params: ['url', 'browserType']
  },
  browser_youtube: {
    name: '▶️ Play YouTube Video',
    description: 'Open and play YouTube video',
    icon: '▶️',
    params: ['videoId', 'browserType', 'autoplay']
  },
  browser_navigate: {
    name: '🔗 Navigate URL',
    description: 'Navigate to any URL in browser',
    icon: '🔗',
    params: ['url', 'browserType']
  },
  browser_close: {
    name: '❌ Close Browser',
    description: 'Close browser window',
    icon: '❌',
    params: []
  }
}

const AI_MODELS = [
  { id: 'claude-opus', name: 'Claude 3 Opus', provider: 'Anthropic', type: 'premium' },
  { id: 'gpt-4o', name: 'GPT-4O', provider: 'OpenAI', type: 'premium' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', type: 'premium' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', type: 'standard' },
  { id: 'llama-2', name: 'Llama 2 (Free)', provider: 'Meta', type: 'free' },
  { id: 'mistral-7b', name: 'Mistral 7B (Free)', provider: 'Mistral', type: 'free' }
]

function TaskTypeSelector({ selected, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">Task Type</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-left flex items-center justify-between hover:border-brand-500 transition-colors"
      >
        <span className="flex items-center gap-2">
          {selected && <span>{AGENT_CAPABILITIES[selected].icon}</span>}
          {selected ? AGENT_CAPABILITIES[selected].name : 'Select a task type'}
        </span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20">
          {Object.entries(AGENT_CAPABILITIES).map(([key, task]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key)
                setOpen(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-800 border-b border-gray-800 last:border-b-0 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{task.icon}</span>
                <div>
                  <p className="font-medium text-white">{task.name}</p>
                  <p className="text-xs text-gray-500">{task.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AIThinkingBox({ thinking, loading }) {
  const [expanded, setExpanded] = useState(false)

  if (!thinking && !loading) return null

  return (
    <div className="card p-4 bg-purple-900/20 border-purple-600/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 text-left"
      >
        <SparklesIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-purple-300 flex items-center gap-2">
            AI Analysis
            {loading && <span className="animate-spin text-sm">⏳</span>}
          </p>
          {!expanded && thinking && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{thinking}</p>
          )}
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && thinking && (
        <div className="mt-3 pl-8 text-sm text-gray-300 max-h-64 overflow-y-auto">
          <p className="whitespace-pre-wrap">{thinking}</p>
        </div>
      )}
    </div>
  )
}

function N8nWorkflowVisualization({ workflow, task }) {
  if (!workflow) return null

  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <DocumentTextIcon className="w-5 h-5 text-brand-400" />
        N8N Workflow Format
      </h3>

      <div className="bg-gray-900 rounded-lg p-4 space-y-3 font-mono text-sm overflow-x-auto">
        {/* Start Node */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-green-900/30 border border-green-600/30 rounded text-green-300 whitespace-nowrap">
            ▶ Start
          </div>
          <div className="flex-1 h-0.5 bg-gray-700"></div>
        </div>

        {/* Task Node */}
        <div className="flex items-center gap-2 ml-8">
          <div className="px-3 py-2 bg-brand-900/30 border border-brand-600/30 rounded text-brand-300 whitespace-nowrap">
            ⚡ {AGENT_CAPABILITIES[task]?.name || 'Task'}
          </div>
          <div className="flex-1 h-0.5 bg-gray-700"></div>
        </div>

        {/* Parameters */}
        {Object.entries(workflow.steps[0]?.params || {}).length > 0 && (
          <div className="ml-16 space-y-1 text-xs text-gray-400">
            <p className="font-semibold text-gray-300">Parameters:</p>
            {Object.entries(workflow.steps[0].params).map(([key, value]) => (
              <p key={key}>
                <span className="text-gray-500">{key}:</span> <span className="text-blue-300">{value}</span>
              </p>
            ))}
          </div>
        )}

        {/* End Node */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-blue-900/30 border border-blue-600/30 rounded text-blue-300 whitespace-nowrap">
            ✓ Complete
          </div>
        </div>

        {/* Raw JSON */}
        <details className="mt-4 cursor-pointer">
          <summary className="text-gray-400 hover:text-gray-300 text-xs">Raw JSON Format</summary>
          <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto text-gray-400">
{JSON.stringify(workflow, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

function CommandPreview({ command, params }) {
  const renderCommand = () => {
    if (!command) return 'Select a task to see command preview'
    
    const cap = AGENT_CAPABILITIES[command]
    
    let preview = `/${cap.name.toLowerCase().replace(/\s+/g, '-')} `
    Object.entries(params).forEach(([key, value]) => {
      if (value) preview += `--${key}="${value}" `
    })
    
    return preview.trim()
  }

  return (
    <div className="card p-4 bg-gray-900/50">
      <p className="text-xs text-gray-500 mb-2">Command Preview</p>
      <div className="bg-black/50 p-3 rounded border border-gray-700 font-mono text-sm text-green-400 break-all">
        {renderCommand()}
      </div>
    </div>
  )
}

export default function TaskCreationPage() {
  const [taskType, setTaskType] = useState('')
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [aiModel, setAiModel] = useState('claude-opus')
  const [description, setDescription] = useState('')
  const [params, setParams] = useState({})
  const [aiThinking, setAiThinking] = useState('')
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [thinkingLoading, setThinkingLoading] = useState(false)
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [executionHistory, setExecutionHistory] = useState([])
  const [scheduleTask, setScheduleTask] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleFrequency, setScheduleFrequency] = useState('daily')
  const [scheduleName, setScheduleName] = useState('')

  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await api.get('/agents')
        setAgents(res.data.agents || [])
        if (res.data.agents?.length > 0) {
          setSelectedAgent(res.data.agents[0].id)
        }
      } catch (_) {}
    }
    loadAgents()
  }, [])

  // Load execution history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/tasks?limit=10')
        setExecutionHistory(res.data.tasks || [])
      } catch (_) {}
    }
    loadHistory()
  }, [])

  const handleParamChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const generateCronExpression = (time, frequency) => {
    const [hour, minute] = time.split(':')
    
    switch(frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        return `${minute} ${hour} * * 1` // Monday
      case 'monthly':
        return `${minute} ${hour} 1 * *` // 1st of month
      default:
        return `${minute} ${hour} * * *`
    }
  }

  const generateAIThinking = async () => {
    if (!taskType || !description) {
      toast.error('Select a task type and provide description')
      return
    }

    setThinkingLoading(true)
    try {
      const res = await api.post('/ai/think', {
        model: aiModel,
        taskType: AGENT_CAPABILITIES[taskType].name,
        description,
        capabilities: AGENT_CAPABILITIES[taskType].params
      })

      setAiThinking(res.data.thinking || res.data.message)
      
      // Auto-generate workflow from AI analysis
      generateWorkflow(res.data.thinking)
    } catch (err) {
      toast.error('Failed to get AI analysis')
    } finally {
      setThinkingLoading(false)
    }
  }

  const generateWorkflow = (thinking = null) => {
    if (!taskType) {
      toast.error('Select a task type first')
      return
    }

    const cap = AGENT_CAPABILITIES[taskType]
    const newWorkflow = {
      name: `${cap.name} Workflow`,
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          name: 'Start',
          position: [100, 100]
        },
        {
          id: 'task',
          type: 'task',
          name: cap.name,
          action: taskType,
          parameters: params,
          position: [300, 100]
        },
        {
          id: 'response',
          type: 'response',
          name: 'Complete',
          position: [500, 100]
        }
      ],
      steps: [
        {
          id: taskType,
          type: taskType,
          params: params,
          description: thinking || description
        }
      ],
      connections: [
        { source: 'trigger', target: 'task' },
        { source: 'task', target: 'response' }
      ]
    }

    setWorkflow(newWorkflow)
    setShowWorkflow(true)
  }

  const executeTask = async () => {
    if (!taskType || !selectedAgent) {
      toast.error('Select task type and agent')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/tasks/create', {
        agent_id: selectedAgent,
        type: taskType,
        description,
        parameters: params,
        ai_model: aiModel,
        ai_thinking: aiThinking,
        workflow: workflow
      })

      if (res.data.success) {
        const taskId = res.data.data?.id
        toast.success('Task created and sent to agent!')
        
        // Create schedule if enabled
        if (scheduleTask && taskId) {
          try {
            const cronExpr = generateCronExpression(scheduleTime, scheduleFrequency)
            const scheduleRes = await api.post('/schedules', {
              name: scheduleName || `${AGENT_CAPABILITIES[taskType]?.name} - ${scheduleFrequency}`,
              description: description,
              cronExpression: cronExpr,
              taskId: taskId,
              estimatedDuration: 300
            })
            
            if (scheduleRes.data.success) {
              toast.success(`Schedule created: ${generateCronExpression(scheduleTime, scheduleFrequency)}`)
            }
          } catch (err) {
            toast.error('Failed to create schedule: ' + (err.response?.data?.message || err.message))
          }
        }
        
        // Clear form
        setTaskType('')
        setDescription('')
        setParams({})
        setAiThinking('')
        setWorkflow(null)
        setShowWorkflow(false)
        setScheduleTask(false)
        setScheduleName('')

        // Reload history
        const historyRes = await api.get('/tasks?limit=10')
        setExecutionHistory(historyRes.data.tasks || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <WrenchIcon className="w-8 h-8 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">Task Creator</h1>
        </div>
        <p className="text-gray-500 text-sm">Create AI-powered workflows and send tasks to agents with full control</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Configuration */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-sm">1</span>
              Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.status === 'online' ? '🟢' : '🔴'}
                    </option>
                  ))}
                </select>
                {selectedAgentData && (
                  <p className="text-xs text-gray-500 mt-1">
                    Status: <span className={selectedAgentData.status === 'online' ? 'text-green-400' : 'text-red-400'}>
                      {selectedAgentData.status}
                    </span>
                  </p>
                )}
              </div>

              {/* Task Type */}
              <div>
                <TaskTypeSelector selected={taskType} onChange={setTaskType} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want the agent to do..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none resize-none h-20"
              />
            </div>

            {/* Task Parameters */}
            {taskType && AGENT_CAPABILITIES[taskType].params.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-300">Parameters</p>
                {AGENT_CAPABILITIES[taskType].params.map(param => (
                  <input
                    key={param}
                    type="text"
                    placeholder={`${param} (e.g., value)`}
                    value={params[param] || ''}
                    onChange={(e) => handleParamChange(param, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none text-sm"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Step 2: AI Analysis */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-sm">2</span>
              AI Analysis (Optional)
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              >
                {AI_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateAIThinking}
              disabled={thinkingLoading || !taskType}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                thinkingLoading || !taskType
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-500 active:scale-95'
              }`}
            >
              {thinkingLoading ? '🤔 Analyzing...' : '✨ Get AI Recommendations'}
            </button>

            <AIThinkingBox thinking={aiThinking} loading={thinkingLoading} />
          </div>

          {/* Step 3: Workflow */}
          {taskType && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-sm">3</span>
                Workflow & Execution
              </h2>

              <button
                onClick={() => (showWorkflow ? setShowWorkflow(false) : generateWorkflow())}
                className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                {showWorkflow ? '🔽 Hide Workflow' : '📊 Generate Workflow'}
              </button>

              {showWorkflow && <N8nWorkflowVisualization workflow={workflow} task={taskType} />}
              
              <CommandPreview command={taskType} params={params} />

              <button
                onClick={executeTask}
                disabled={loading || !selectedAgent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  loading || !selectedAgent
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-500 active:scale-95'
                }`}
              >
                {loading ? '⏳ Executing...' : '▶️ Execute Task'}
              </button>
            </div>
          )}

          {/* Step 4: Scheduling (Optional) */}
          {taskType && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-sm">4</span>
                Schedule Task (Optional)
              </h2>

              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="scheduleTask"
                  checked={scheduleTask}
                  onChange={(e) => setScheduleTask(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="scheduleTask" className="text-sm font-medium text-gray-300 cursor-pointer flex-1">
                  Run this task on a schedule
                </label>
              </div>

              {scheduleTask && (
                <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
                  {/* Schedule Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Name (Optional)</label>
                    <input
                      type="text"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                      placeholder={`${AGENT_CAPABILITIES[taskType]?.name} - Daily`}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                      <select
                        value={scheduleFrequency}
                        onChange={(e) => setScheduleFrequency(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly (Monday)</option>
                        <option value="monthly">Monthly (1st)</option>
                      </select>
                    </div>
                  </div>

                  {/* Cron Expression Preview */}
                  <div className="p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Cron Expression:</p>
                    <code className="text-sm font-mono text-purple-300">
                      {generateCronExpression(scheduleTime, scheduleFrequency)}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      {scheduleFrequency === 'daily' && `Runs daily at ${scheduleTime}`}
                      {scheduleFrequency === 'weekly' && `Runs every Monday at ${scheduleTime}`}
                      {scheduleFrequency === 'monthly' && `Runs on the 1st of each month at ${scheduleTime}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Task Capabilities & History */}
        <div className="space-y-6">
          {/* Capabilities */}
          <div className="card p-4">
            <h3 className="font-semibold text-white mb-3">Agent Capabilities</h3>
            <div className="space-y-2">
              {Object.entries(AGENT_CAPABILITIES).map(([key, task]) => (
                <button
                  key={key}
                  onClick={() => setTaskType(key)}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    taskType === key
                      ? 'bg-brand-600/20 border border-brand-600/30 text-brand-300'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <p className="text-sm font-medium">{task.icon} {task.name}</p>
                  <p className="text-xs text-gray-500">{task.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Executions */}
          <div className="card p-4">
            <h3 className="font-semibold text-white mb-3">Recent Tasks</h3>
            {executionHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executionHistory.slice(0, 5).map(task => (
                  <div key={task.id} className="p-2 bg-gray-800/50 rounded text-xs">
                    <p className="font-medium text-white truncate">{task.command || task.type}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-500">{task.agent_name}</span>
                      <span className={
                        task.status === 'completed' ? 'text-green-400' :
                        task.status === 'failed' ? 'text-red-400' :
                        'text-yellow-400'
                      }>
                        {task.status === 'completed' ? '✓' : task.status === 'failed' ? '✕' : '⟳'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Models Info */}
          <div className="card p-4 bg-blue-900/20 border-blue-600/30 text-xs">
            <p className="font-semibold text-blue-300 mb-2">Available Models</p>
            <ul className="space-y-1 text-gray-300">
              {AI_MODELS.map(model => (
                <li key={model.id}>
                  • {model.name} <span className="text-gray-600">({model.type})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
