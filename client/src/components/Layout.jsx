import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  HomeIcon, CpuChipIcon, ClipboardDocumentListIcon,
  CommandLineIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  BellIcon, Bars3Icon, XMarkIcon, EnvelopeIcon, SparklesIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useAgentStore } from '../store/agentStore'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'
import api from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/agents', label: 'Agents', icon: CpuChipIcon },
  { to: '/tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
  { to: '/tasks/create', label: 'Task Creator', icon: SparklesIcon },
  { to: '/workflow-builder', label: 'Workflow Builder', icon: RectangleStackIcon },
  { to: '/email-workflow', label: 'Email Workflow', icon: EnvelopeIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon }
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { setAgents, updateAgentStatus } = useAgentStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    try {
      // Init WebSocket
      const socket = connectSocket()

      if (socket) {
        socket.on('agents:initial', ({ agents }) => {
          setAgents(agents)
        })

        socket.on('agent:status', ({ agentId, status, name }) => {
          updateAgentStatus(agentId, status)
          const msg = status === 'online' ? `🤖 ${name} connected` : `⚠️ ${name} disconnected`
          const toastFn = status === 'online' ? toast.success : toast.error
          toastFn(msg, { duration: 3000 })
        })

        socket.on('task:updated', ({ taskId, status, agentId }) => {
          if (status === 'completed') toast.success(`Task completed`)
          if (status === 'failed') toast.error(`Task failed`)
        })
      }

      // Load notification count
      api.get('/dashboard/notifications').then(res => {
        setNotifCount(res.data.unreadCount || 0)
      }).catch(err => {
        console.warn('[Layout] Failed to load notifications:', err.message)
      })

      return () => {
        disconnectSocket()
      }
    } catch (err) {
      console.error('[Layout] Error initializing socket:', err)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">M</div>
          <div>
            <h1 className="font-bold text-white text-sm">MomoBot</h1>
            <p className="text-xs text-gray-500">Agent Platform</p>
          </div>
          <button className="ml-auto lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar */}
        <header className="h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-10">
          <button className="lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <button className="relative text-gray-400 hover:text-white transition-colors">
            <BellIcon className="w-6 h-6" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
