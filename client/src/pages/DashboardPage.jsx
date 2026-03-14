import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAgentStore } from '../store/agentStore'
import api from '../services/api'
import {
  CpuChipIcon, ClipboardDocumentListIcon, CheckCircleIcon,
  XCircleIcon, SignalIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ icon: Icon, label, value, color = 'brand', sub }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-900/30',
    green: 'text-green-400 bg-green-900/30',
    yellow: 'text-yellow-400 bg-yellow-900/30',
    red: 'text-red-400 bg-red-900/30'
  }
  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { agents } = useAgentStore()
  const [stats, setStats] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard/stats')
        setStats(res.data.stats)
        setRecentTasks(res.data.recentTasks || [])
      } catch (_) {}
      setLoading(false)
    }
    load()

    const interval = setInterval(load, 15000) // Refresh every 15s
    return () => clearInterval(interval)
  }, [])

  const onlineAgents = agents.filter(a => a.status === 'online' || a.isLive)

  const statusBadge = (status) => {
    const map = {
      completed: 'badge-completed',
      failed: 'badge-failed',
      running: 'badge-running',
      pending: 'badge-pending',
      dispatched: 'badge-running',
      cancelled: 'badge-offline'
    }
    return <span className={map[status] || 'badge'}>{status}</span>
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Real-time overview of your agent network</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={CpuChipIcon} label="Total Agents" value={loading ? '...' : stats?.totalAgents ?? 0} color="brand" />
        <StatCard icon={SignalIcon} label="Online Now" value={loading ? '...' : stats?.liveConnections ?? 0} color="green" sub="Live WebSocket connections" />
        <StatCard icon={ArrowTrendingUpIcon} label="Completed Today" value={loading ? '...' : stats?.completedToday ?? 0} color="green" />
        <StatCard icon={XCircleIcon} label="Failed Today" value={loading ? '...' : stats?.failedToday ?? 0} color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Online Agents */}
        <div className="card xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Live Agents</h2>
            <Link to="/agents" className="text-xs text-brand-400 hover:text-brand-300">View all</Link>
          </div>

          {onlineAgents.length === 0 ? (
            <div className="text-center py-8">
              <CpuChipIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No agents online</p>
              <Link to="/agents" className="text-xs text-brand-400 hover:text-brand-300 mt-2 inline-block">
                Register an agent →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {onlineAgents.map(agent => (
                <Link key={agent.id} to={`/agents/${agent.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
                  <div className="status-dot-online" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500 truncate">{agent.hostname || agent.ip_address || 'Connected'}</p>
                  </div>
                  <span className="badge-online">online</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Tasks</h2>
            <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300">View all</Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 text-xs">
                    <th className="pb-2 font-medium">Command</th>
                    <th className="pb-2 font-medium">Agent</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentTasks.map(task => (
                    <tr key={task.id} className="text-gray-300">
                      <td className="py-2 max-w-48 truncate font-mono text-xs pr-4">{task.command}</td>
                      <td className="py-2 text-gray-500 pr-4">{task.agent_name}</td>
                      <td className="py-2 pr-4">{statusBadge(task.status)}</td>
                      <td className="py-2 text-gray-600 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
