import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { ClipboardDocumentListIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { getSocket } from '../services/socket'

function StatusBadge({ status }) {
  const map = {
    completed: 'badge-completed', failed: 'badge-failed', running: 'badge-running',
    pending: 'badge-pending', dispatched: 'badge-running', cancelled: 'badge-offline'
  }
  return <span className={map[status] || 'badge'}>{status}</span>
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', agent_id: '' })
  const [page, setPage] = useState(0)
  const [selectedTask, setSelectedTask] = useState(null)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: page * LIMIT })
      if (filter.status) params.set('status', filter.status)
      if (filter.agent_id) params.set('agent_id', filter.agent_id)
      const res = await api.get(`/tasks?${params}`)
      setTasks(res.data.tasks || [])
      setTotal(res.data.total || 0)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filter])

  useEffect(() => {
    const socket = getSocket()
    if (socket) {
      socket.on('task:created', ({ task }) => {
        setTasks(prev => [task, ...prev])
      })
      socket.on('task:updated', ({ taskId, status }) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      })
      return () => {
        socket.off('task:created')
        socket.off('task:updated')
      }
    }
  }, [])

  const cancelTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'cancelled' } : t))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} total tasks</p>
        </div>

        <div className="flex gap-2">
          <select
            value={filter.status}
            onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(0) }}
            className="input w-36 text-sm"
          >
            <option value="">All Status</option>
            {['pending', 'dispatched', 'running', 'completed', 'failed', 'cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="xl:col-span-2 card overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardDocumentListIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="px-4 py-3 font-medium">Command</th>
                    <th className="px-4 py-3 font-medium">Agent</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {tasks.map(task => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-green-400 max-w-48 truncate">{task.command}</td>
                      <td className="px-4 py-3 text-gray-400">{task.agent_name}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{task.type}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        {['pending', 'dispatched'].includes(task.status) && (
                          <button onClick={e => { e.stopPropagation(); cancelTask(task.id) }}
                            className="text-gray-600 hover:text-red-400">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800 bg-gray-800/30">
              <p className="text-xs text-gray-500">Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary text-xs py-1 px-3">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total} className="btn-secondary text-xs py-1 px-3">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Task Detail */}
        <div className="card">
          {!selectedTask ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">Select a task to view details</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Task Details</h3>
                <StatusBadge status={selectedTask.status} />
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { label: 'Type', value: selectedTask.type },
                  { label: 'Agent', value: selectedTask.agent_name },
                  { label: 'Priority', value: selectedTask.priority },
                  { label: 'Created by', value: selectedTask.created_by_name }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300">{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Command</p>
                <code className="block bg-gray-800 rounded-lg p-3 text-xs text-green-400 font-mono break-all">
                  {selectedTask.command}
                </code>
              </div>

              {selectedTask.stdout && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Output</p>
                  <pre className="bg-gray-950 rounded-lg p-3 text-xs text-gray-300 max-h-48 overflow-y-auto scrollbar-thin">
                    {selectedTask.stdout}
                  </pre>
                </div>
              )}

              {selectedTask.stderr && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Stderr</p>
                  <pre className="bg-gray-950 rounded-lg p-3 text-xs text-red-400 max-h-48 overflow-y-auto scrollbar-thin">
                    {selectedTask.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
