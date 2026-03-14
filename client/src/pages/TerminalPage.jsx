import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSocket } from '../services/socket'
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import { format } from 'date-fns'

export default function TerminalPage() {
  const { agentId } = useParams()
  const [agent, setAgent] = useState(null)
  const [lines, setLines] = useState([
    { type: 'system', text: 'MomoBot Remote Terminal - Connected', ts: new Date() },
    { type: 'system', text: 'Type commands to dispatch to the agent', ts: new Date() }
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    api.get(`/agents/${agentId}`).then(res => {
      setAgent(res.data.agent)
      setLines(prev => [
        ...prev,
        { type: 'system', text: `Connected to: ${res.data.agent.name} (${res.data.agent.hostname || res.data.agent.ip_address || 'Unknown'})`, ts: new Date() }
      ])
    }).catch(() => {})

    const socket = getSocket()
    if (socket) {
      socket.emit('agent:subscribe', { agentId })

      socket.on('task:updated', ({ taskId, status, stdout, stderr, exitCode }) => {
        if (status === 'completed' || status === 'failed') {
          if (stdout) setLines(prev => [...prev, { type: 'stdout', text: stdout, ts: new Date() }])
          if (stderr) setLines(prev => [...prev, { type: 'stderr', text: stderr, ts: new Date() }])
          if (!stdout && !stderr) {
            setLines(prev => [...prev, { type: status === 'completed' ? 'success' : 'error', text: `[Exit code: ${exitCode ?? 'unknown'}]`, ts: new Date() }])
          }
          setLoading(false)
        }
        if (status === 'running') {
          setLines(prev => [...prev, { type: 'system', text: '► Running...', ts: new Date() }])
        }
      })

      return () => {
        socket.emit('agent:unsubscribe', { agentId })
        socket.off('task:updated')
      }
    }
  }, [agentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const sendCommand = async () => {
    const cmd = input.trim()
    if (!cmd || loading) return

    setLines(prev => [...prev, { type: 'input', text: `$ ${cmd}`, ts: new Date() }])
    setHistory(prev => [cmd, ...prev.slice(0, 49)])
    setHistIdx(-1)
    setInput('')
    setLoading(true)

    try {
      await api.post('/tasks', {
        agent_id: agentId,
        type: 'shell',
        command: cmd,
        timeout: 30000
      })
    } catch (err) {
      setLines(prev => [...prev, { type: 'error', text: err.response?.data?.error || 'Failed to dispatch', ts: new Date() }])
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') return sendCommand()
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx] || '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
    }
  }

  const lineStyle = (type) => ({
    input: 'text-green-400',
    stdout: 'text-gray-300',
    stderr: 'text-red-400',
    system: 'text-blue-400',
    error: 'text-red-500',
    success: 'text-green-500'
  }[type] || 'text-gray-400')

  return (
    <div className="h-full flex flex-col max-w-5xl" style={{ height: 'calc(100vh - 96px)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link to={`/agents/${agentId}`} className="btn-ghost p-2"><ArrowLeftIcon className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-mono">
            {agent ? `${agent.hostname || agent.name}` : 'Terminal'}
          </h1>
          <p className="text-gray-500 text-sm">Remote shell via MomoBot agent</p>
        </div>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Terminal window */}
      <div className="flex-1 bg-gray-950 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
        {/* Output */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin font-mono text-sm space-y-0.5"
          onClick={() => inputRef.current?.focus()}>
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all leading-relaxed ${lineStyle(line.type)}`}>
              {line.text}
            </div>
          ))}
          {loading && (
            <div className="text-yellow-400 animate-pulse">▋</div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 px-4 py-3 flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm flex-shrink-0">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={loading ? 'Waiting for result...' : 'Enter command...'}
            disabled={loading}
            className="flex-1 bg-transparent text-gray-100 font-mono text-sm outline-none placeholder-gray-700"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <button onClick={sendCommand} disabled={loading || !input.trim()} className="btn-primary py-1.5 px-3">
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
