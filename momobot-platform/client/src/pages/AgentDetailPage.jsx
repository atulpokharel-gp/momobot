import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { connectSocket } from '../services/socket'
import toast from 'react-hot-toast'
import { getSocket } from '../services/socket'
import {
  CpuChipIcon, CommandLineIcon, ClipboardDocumentListIcon,
  ArrowLeftIcon, PlayIcon, SignalIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, format } from 'date-fns'
import { useForm } from 'react-hook-form'

const TASK_TYPES = ['shell', 'script', 'file_read', 'system_info', 'process_list', 'custom']

function TaskForm({ agentId, onTaskCreated }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/tasks', { agent_id: agentId, ...data })
      toast.success(res.data.message)
      reset()
      onTaskCreated && onTaskCreated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Command / Script</label>
          <input
            className="input font-mono text-xs"
            placeholder="e.g. ls -la  or  Get-Process"
            {...register('command', { required: 'Command required' })}
          />
          {errors.command && <p className="text-red-400 text-xs mt-1">{errors.command.message}</p>}
        </div>
        <div>
          <label className="label">Task Type</label>
          <select className="input" {...register('type', { required: true })}>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority (1-10)</label>
          <input type="number" min="1" max="10" defaultValue="5" className="input" {...register('priority')} />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        <PlayIcon className="w-4 h-4" />
        {loading ? 'Dispatching...' : 'Dispatch Task'}
      </button>
    </form>
  )
}

function StatusBadge({ status }) {
  const map = {
    completed: 'badge-completed', failed: 'badge-failed', running: 'badge-running',
    pending: 'badge-pending', dispatched: 'badge-running', cancelled: 'badge-offline'
  }
  return <span className={map[status] || 'badge'}>{status}</span>
}

export default function AgentDetailPage() {
  const { id } = useParams()
  const [agent, setAgent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  const load = async () => {
    try {
      const res = await api.get(`/agents/${id}`)
      setAgent(res.data.agent)
      setTasks(res.data.tasks || [])
      setLogs(res.data.logs || [])
    } catch (_) {
      toast.error('Agent not found')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()

    // Subscribe to live updates via socket
    const socket = getSocket()
    if (socket) {
      socket.emit('agent:subscribe', { agentId: id })

      socket.on('task:updated', ({ taskId, status }) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      })

      socket.on('agent:log', ({ agentId: aid, ...logData }) => {
        if (aid === id) setLogs(prev => [{ ...logData, id: Date.now() }, ...prev.slice(0, 99)])
      })

      return () => {
        socket.emit('agent:unsubscribe', { agentId: id })
        socket.off('task:updated')
        socket.off('agent:log')
      }
    }
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  if (!agent) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Agent not found</p>
      <Link to="/agents" className="btn-secondary mt-4 inline-flex">Back to Agents</Link>
    </div>
  )

  const isOnline = agent.status === 'online'

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link to="/agents" className="btn-ghost p-2"><ArrowLeftIcon className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{agent.name}</h1>
            <span className={isOnline ? 'badge-online' : 'badge-offline'}>
              <span className={isOnline ? 'status-dot-online' : 'status-dot-offline'} />
              {agent.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{agent.description || 'No description'}</p>
        </div>
        {isOnline && (
          <Link to={`/terminal/${id}`} className="btn-primary">
            <CommandLineIcon className="w-4 h-4" /> Terminal
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent Info */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-white mb-4">System Info</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Platform', value: agent.platform },
                { label: 'Hostname', value: agent.hostname },
                { label: 'IP Address', value: agent.ip_address },
                { label: 'Version', value: agent.agent_version },
                { label: 'Owner', value: agent.owner_name },
                { label: 'Last Seen', value: agent.last_seen ? formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true }) : 'Never' }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-300">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {agent.capabilities?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-3">Capabilities</h2>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map(cap => (
                  <span key={cap} className="badge bg-brand-900/30 text-brand-400 border border-brand-800">{cap}</span>
                ))}
              </div>
            </div>
          )}

          {/* Task Dispatch */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4">Dispatch Task</h2>
            {isOnline
              ? <TaskForm agentId={agent.id} onTaskCreated={load} />
              : <p className="text-gray-500 text-sm text-center py-4">Agent is offline. Tasks will be queued.</p>
            }
            {!isOnline && <TaskForm agentId={agent.id} onTaskCreated={load} />}
          </div>
        </div>

        {/* Tasks & Logs */}
        <div className="xl:col-span-2 card">
          <div className="flex gap-4 border-b border-gray-800 -mx-6 px-6 mb-4">
            {['tasks', 'logs'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-white'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'tasks' ? (
            tasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No tasks yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {tasks.map(task => (
                  <div key={task.id} className="bg-gray-800 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs text-green-400 font-mono truncate flex-1 mr-3">{task.command}</code>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>{task.type}</span>
                      <span>{format(new Date(task.created_at), 'HH:mm:ss MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">No logs yet</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin font-mono text-xs">
                {logs.map(log => (
                  <div key={log.id} className={`flex gap-3 p-2 rounded ${
                    log.level === 'error' ? 'text-red-400 bg-red-900/10' :
                    log.level === 'warn' ? 'text-yellow-400 bg-yellow-900/10' :
                    'text-gray-400'
                  }`}>
                    <span className="text-gray-600 flex-shrink-0">{log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : ''}</span>
                    <span className="uppercase w-12 flex-shrink-0">{log.level}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
