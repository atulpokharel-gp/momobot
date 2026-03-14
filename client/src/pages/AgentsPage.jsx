import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAgentStore } from '../store/agentStore'
import toast from 'react-hot-toast'
import {
  PlusIcon, CpuChipIcon, TrashIcon, CommandLineIcon,
  EllipsisVerticalIcon, ClipboardDocumentIcon, ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { useForm } from 'react-hook-form'
import { Dialog } from '@headlessui/react'

function CreateAgentModal({ open, onClose, onCreated }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [createdCreds, setCreatedCreds] = useState(null)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/agents', data)
      setCreatedCreds(res.data.agent)
      onCreated && onCreated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create agent')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setCreatedCreds(null)
    reset()
    onClose()
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-lg font-semibold text-white mb-6">Register New Agent</Dialog.Title>

            {!createdCreds ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Agent Name</label>
                  <input className="input" placeholder="My Home PC" {...register('name', { required: 'Name required' })} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Description (Optional)</label>
                  <input className="input" placeholder="Gaming rig in bedroom" {...register('description')} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={handleClose}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Agent'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
                  <p className="text-green-400 font-medium mb-2">✅ Agent Created!</p>
                  <p className="text-gray-400 text-sm">Copy these credentials. The secret key won't be shown again.</p>
                </div>

                {[
                  { label: 'Agent ID', value: createdCreds.id },
                  { label: 'API Key', value: createdCreds.apiKey },
                  { label: 'Secret Key', value: createdCreds.secretKey },
                  { label: 'Server URL', value: createdCreds.serverUrl }
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <code className="text-xs text-green-400 flex-1 truncate">{value}</code>
                      <button onClick={() => copy(value)} className="text-gray-500 hover:text-white flex-shrink-0">
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="bg-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium mb-2">Install MomoBot on your local machine:</p>
                  <code className="text-xs text-brand-400 block">
                    cd momobot-agent{'\n'}
                    npm install{'\n'}
                    node src/index.js
                  </code>
                  <p className="text-xs text-gray-500 mt-2">Configure with the credentials above in momobot-agent/.env</p>
                </div>

                <button className="btn-primary w-full" onClick={handleClose}>Done</button>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default function AgentsPage() {
  const { agents, setAgents, removeAgent } = useAgentStore()
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/agents')
      setAgents(res.data.agents)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteAgent = async (agentId, name) => {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/agents/${agentId}`)
      removeAgent(agentId)
      toast.success('Agent deleted')
    } catch (err) {
      toast.error('Failed to delete agent')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your MomoBot local agents</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <PlusIcon className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-40 bg-gray-800" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="card text-center py-16">
          <CpuChipIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No agents yet</h3>
          <p className="text-gray-500 mb-6 text-sm">Register your first MomoBot agent to get started</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <PlusIcon className="w-4 h-4" /> Register First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="card hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    agent.status === 'online' || agent.isLive ? 'bg-green-900/30' : 'bg-gray-800'
                  }`}>
                    <CpuChipIcon className={`w-6 h-6 ${agent.status === 'online' || agent.isLive ? 'text-green-400' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
                    <p className="text-xs text-gray-500">{agent.platform || 'Unknown platform'}</p>
                  </div>
                </div>
                <span className={agent.status === 'online' || agent.isLive ? 'badge-online' : 'badge-offline'}>
                  <span className={agent.status === 'online' || agent.isLive ? 'status-dot-online' : 'status-dot-offline'} />
                  {agent.status === 'online' || agent.isLive ? 'online' : 'offline'}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                {agent.hostname && <p className="text-xs text-gray-500">Host: <span className="text-gray-400">{agent.hostname}</span></p>}
                {agent.ip_address && <p className="text-xs text-gray-500">IP: <span className="text-gray-400">{agent.ip_address}</span></p>}
                {agent.last_seen && (
                  <p className="text-xs text-gray-500">
                    Last seen: <span className="text-gray-400">{formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-800">
                <Link to={`/agents/${agent.id}`} className="btn-secondary flex-1 text-xs py-1.5">
                  View Details
                </Link>
                {(agent.status === 'online' || agent.isLive) && (
                  <Link to={`/terminal/${agent.id}`} className="btn-primary text-xs py-1.5 px-3">
                    <CommandLineIcon className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button onClick={() => deleteAgent(agent.id, agent.name)}
                  className="btn-ghost text-xs py-1.5 px-3 hover:text-red-400">
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAgentModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  )
}
