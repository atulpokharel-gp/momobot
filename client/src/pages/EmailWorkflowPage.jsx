import { useEffect, useState } from 'react'
import { useAgentStore } from '../store/agentStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon,
  InformationCircleIcon, SparklesIcon
} from '@heroicons/react/24/outline'

const EMAIL_FOLDERS = [
  { value: 'INBOX', label: '📥 INBOX' },
  { value: 'SENT', label: '📤 SENT' },
  { value: 'DRAFTS', label: '✏️ DRAFTS' },
  { value: 'SPAM', label: '🚫 SPAM' },
  { value: 'TRASH', label: '🗑️ TRASH' },
  { value: 'ARCHIVE', label: '📦 ARCHIVE' }
]

function StatusBox({ type = 'info', message, icon }) {
  const styles = {
    success: 'bg-green-900/30 border-green-600/30 text-green-400',
    error: 'bg-red-900/30 border-red-600/30 text-red-400',
    warning: 'bg-yellow-900/30 border-yellow-600/30 text-yellow-400',
    info: 'bg-blue-900/30 border-blue-600/30 text-blue-400'
  }
  return (
    <div className={`border-l-4 p-4 rounded-lg ${styles[type] || styles.info}`}>
      <p className="text-sm flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {message}
      </p>
    </div>
  )
}

function EmailCard({ email }) {
  const priorityColors = {
    critical: 'bg-red-900/40 text-red-300 border-red-600/30',
    high: 'bg-orange-900/40 text-orange-300 border-orange-600/30',
    normal: 'bg-gray-700 text-gray-300 border-gray-600/30',
    low: 'bg-blue-900/40 text-blue-300 border-blue-600/30'
  }

  const badgeStyles = {
    critical: 'bg-red-900/60 text-red-200',
    high: 'bg-orange-900/60 text-orange-200'
  }

  return (
    <div className="card p-4 hover:border-brand-600/50 transition-all hover:shadow-lg hover:shadow-brand-600/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{email.from}</p>
          <p className="text-xs text-gray-500 mt-1">{email.received}</p>
        </div>
        {email.read === false && (
          <span className="badge-running text-xs">UNREAD</span>
        )}
      </div>

      <p className="text-sm font-medium text-gray-100 mb-2 line-clamp-2">{email.subject}</p>
      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{email.preview}</p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700">
        <div>
          {email.priority !== 'normal' && (
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badgeStyles[email.priority] || ''}`}>
              {email.priority.toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{email.id}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-900/30 text-brand-400 border-brand-600/30',
    green: 'bg-green-900/30 text-green-400 border-green-600/30',
    orange: 'bg-orange-900/30 text-orange-400 border-orange-600/30',
    red: 'bg-red-900/30 text-red-400 border-red-600/30'
  }

  return (
    <div className={`card p-4 border ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6" />
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function EmailWorkflowPage() {
  const { agents } = useAgentStore()
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('INBOX')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [results, setResults] = useState(null)
  const [executionHistory, setExecutionHistory] = useState([])

  // Set default agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].id)
    }
  }, [agents])

  // Load execution history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/workflows?limit=10')
        setExecutionHistory(res.data.workflows || [])
      } catch (_) {}
    }
    loadHistory()
  }, [])

  const startEmailCheck = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent')
      return
    }

    setLoading(true)
    setStatus({ type: 'info', message: '📡 Initiating email check workflow...' })
    setResults(null)

    try {
      // Call the email workflow API
      const res = await api.post('/workflows/email-check', {
        agent_id: selectedAgent,
        folder: selectedFolder,
        max_results: 10
      })

      if (res.data.success) {
        setStatus({
          type: 'info',
          message: `✅ Workflow started - ID: ${res.data.workflowId.slice(0, 8)}...`
        })

        // Simulate brief delay and show results
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Fetch the execution status
        const statusRes = await api.get(`/workflows/${res.data.workflowId}/status`)
        const execution = statusRes.data.lastExecution

        if (execution && execution.result) {
          const emailData = execution.result.data || execution.result
          const emails = Array.isArray(emailData) ? emailData : emailData.emails || []

          // Calculate statistics
          const stats = {
            total: emails.length,
            unread: emails.filter(e => !e.read).length,
            critical: emails.filter(e => e.priority === 'critical').length,
            high: emails.filter(e => e.priority === 'high').length
          }

          setResults({
            emails,
            stats,
            timestamp: new Date(),
            folder: selectedFolder
          })

          setStatus({
            type: 'success',
            message: `✅ Email check completed - Found ${emails.length} emails in ${selectedFolder}`
          })

          toast.success(`Found ${emails.length} emails!`)
        }
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: `❌ Error: ${err.response?.data?.message || err.message}`
      })
      toast.error('Failed to check emails')
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults(null)
    setStatus(null)
  }

  const activeAgent = agents.find(a => a.id === selectedAgent)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <EnvelopeIcon className="w-8 h-8 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">Email Workflow</h1>
        </div>
        <p className="text-gray-500 text-sm">Check emails and monitor them in real-time</p>
      </div>

      {/* Configuration Card */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-brand-400" />
          Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none transition-colors"
            >
              <option value="">-- Select an agent --</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} {agent.status === 'online' ? '🟢' : '🔴'}
                </option>
              ))}
            </select>
            {activeAgent && (
              <p className="text-xs text-gray-500 mt-2">
                Status: <span className={activeAgent.status === 'online' ? 'text-green-400' : 'text-red-400'}>
                  {activeAgent.status || 'Unknown'}
                </span>
              </p>
            )}
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Folder</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none transition-colors"
            >
              {EMAIL_FOLDERS.map(folder => (
                <option key={folder.value} value={folder.value}>
                  {folder.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={startEmailCheck}
            disabled={loading || !selectedAgent || agents.find(a => a.id === selectedAgent)?.status !== 'online'}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              loading || !selectedAgent || agents.find(a => a.id === selectedAgent)?.status !== 'online'
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-brand-600 text-white hover:bg-brand-500 active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Checking emails...
              </span>
            ) : (
              '▶ Start Email Check'
            )}
          </button>

          {results && (
            <button
              onClick={clearResults}
              className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Status Display */}
      {status && (
        <div>
          <StatusBox
            type={status.type}
            message={status.message}
            icon={
              status.type === 'success' ? '✅' :
              status.type === 'error' ? '❌' :
              status.type === 'warning' ? '⚠️' :
              'ℹ️'
            }
          />
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              Email Results from {results.folder}
            </h2>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={EnvelopeIcon}
                label="Total Emails"
                value={results.stats.total}
                color="brand"
              />
              <StatCard
                icon={ExclamationTriangleIcon}
                label="Unread"
                value={results.stats.unread}
                color="orange"
              />
              <StatCard
                icon={() => <span className="text-xl">🚨</span>}
                label="Critical"
                value={results.stats.critical}
                color="red"
              />
              <StatCard
                icon={() => <span className="text-xl">⚠️</span>}
                label="High Priority"
                value={results.stats.high}
                color="orange"
              />
            </div>
          </div>

          {/* Email Grid */}
          {results.emails.length > 0 ? (
            <div>
              <p className="text-sm text-gray-400 mb-4">{results.emails.length} email(s) found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.emails.map(email => (
                  <EmailCard key={email.id} email={email} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <EnvelopeIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No emails found in {results.folder}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-600">
              Last checked: {results.timestamp.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Workflow Executions</h2>
          <div className="space-y-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 text-xs border-b border-gray-700">
                  <th className="pb-3 font-medium">Workflow</th>
                  <th className="pb-3 font-medium">Folder</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {executionHistory.slice(0, 5).map(execution => (
                  <tr key={execution.id} className="text-gray-300 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2 text-xs font-mono">{execution.name || 'Email Check'}</td>
                    <td className="py-2 text-xs">{execution.config?.folder || 'INBOX'}</td>
                    <td className="py-2">
                      <span className={execution.status === 'completed' ? 'badge-completed' : execution.status === 'running' ? 'badge-running' : 'badge-failed'}>
                        {execution.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(execution.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!results && (
        <div className="card p-6 bg-gray-800/50 border-gray-700/50">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-400" />
            How it works
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Select an agent from the dropdown (must be online)</li>
            <li>• Choose the email folder you want to check</li>
            <li>• Click "Start Email Check" to examine emails</li>
            <li>• View real-time results with email statistics and details</li>
            <li>• Check your recent workflow executions below</li>
          </ul>
        </div>
      )}
    </div>
  )
}
