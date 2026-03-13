import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import AgentDetailPage from './pages/AgentDetailPage'
import TasksPage from './pages/TasksPage'
import TaskCreationPage from './pages/TaskCreationPage'
import WorkflowBuilder from './pages/WorkflowBuilder'
import TerminalPage from './pages/TerminalPage'
import EmailWorkflowPage from './pages/EmailWorkflowPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:id" element={<AgentDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/create" element={<TaskCreationPage />} />
          <Route path="workflow-builder" element={<WorkflowBuilder />} />
          <Route path="email-workflow" element={<EmailWorkflowPage />} />
          <Route path="terminal/:agentId" element={<TerminalPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
