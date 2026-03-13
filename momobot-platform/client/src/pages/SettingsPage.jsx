import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import {
  ShieldCheckIcon, KeyIcon, UserCircleIcon, ClipboardDocumentIcon,
  ArrowPathIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [totpSetup, setTotpSetup] = useState(null)
  const [totpToken, setTotpToken] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setProfile(res.data.user)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const setupTOTP = async () => {
    try {
      const res = await api.post('/auth/2fa/setup')
      setTotpSetup(res.data)
    } catch (_) { toast.error('Failed to setup 2FA') }
  }

  const verifyTOTP = async () => {
    try {
      await api.post('/auth/2fa/verify', { token: totpToken })
      toast.success('2FA enabled!')
      setTotpSetup(null)
      setTotpToken('')
      const res = await api.get('/auth/me')
      setProfile(res.data.user)
      setUser({ ...user, totpEnabled: true })
    } catch (_) { toast.error('Invalid code') }
  }

  const disableTOTP = async () => {
    const token = prompt('Enter your 2FA code to disable:')
    if (!token) return
    try {
      await api.post('/auth/2fa/disable', { token })
      toast.success('2FA disabled')
      const res = await api.get('/auth/me')
      setProfile(res.data.user)
      setUser({ ...user, totpEnabled: false })
    } catch (_) { toast.error('Invalid code') }
  }

  const regenerateApiKey = async () => {
    if (!confirm('Regenerate API key? Any existing integrations will stop working.')) return
    try {
      const res = await api.post('/auth/regenerate-api-key')
      setProfile(p => ({ ...p, api_key: res.data.apiKey }))
      toast.success('API key regenerated')
    } catch (_) { toast.error('Failed') }
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your account and security settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        {[
          { id: 'profile', label: 'Profile', icon: UserCircleIcon },
          { id: 'security', label: 'Security', icon: ShieldCheckIcon },
          { id: 'api', label: 'API Key', icon: KeyIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-white'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white text-lg">Account Info</h2>
          <div className="space-y-3">
            {[
              { label: 'Username', value: profile?.username },
              { label: 'Email', value: profile?.email },
              { label: 'Role', value: profile?.role },
              { label: 'Joined', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
              { label: 'Last Login', value: profile?.last_login ? new Date(profile.last_login).toLocaleString() : '—' }
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500 text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-white text-lg">Two-Factor Authentication</h2>

          {profile?.totp_enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-900/20 border border-green-800 rounded-xl p-4">
                <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium text-sm">2FA is enabled</p>
                  <p className="text-gray-500 text-xs">Your account is protected with TOTP authentication</p>
                </div>
              </div>
              <button onClick={disableTOTP} className="btn-danger">Disable 2FA</button>
            </div>
          ) : !totpSetup ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
              </p>
              <button onClick={setupTOTP} className="btn-primary">
                <ShieldCheckIcon className="w-4 h-4" /> Enable 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-4">
                <p className="text-sm text-gray-400">Scan with your authenticator app:</p>
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={`otpauth://totp/MomoBot:${profile?.email}?secret=${totpSetup.secret}&issuer=MomoBot`} size={160} />
                </div>
                <p className="text-xs text-gray-500">Or enter manually: <code className="text-brand-400">{totpSetup.secret}</code></p>
              </div>

              <div className="space-y-2">
                <label className="label">Enter code from app to confirm</label>
                <input
                  type="text"
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  value={totpToken}
                  onChange={e => setTotpToken(e.target.value)}
                />
                <button onClick={verifyTOTP} className="btn-primary w-full" disabled={totpToken.length !== 6}>Verify & Enable</button>
                <button onClick={() => setTotpSetup(null)} className="btn-ghost w-full">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'api' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white text-lg">API Key</h2>
          <p className="text-gray-500 text-sm">Use this key to authenticate API requests or integrate with external tools.</p>

          <div className="space-y-2">
            <label className="label">Your API Key</label>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono text-brand-400 truncate">
                {showApiKey ? profile?.api_key : profile?.api_key?.replace(/./g, '•')}
              </code>
              <button onClick={() => setShowApiKey(!showApiKey)} className="text-gray-500 hover:text-white">
                {showApiKey ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              <button onClick={() => copy(profile?.api_key)} className="text-gray-500 hover:text-white">
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Usage:</p>
            <code className="text-xs text-brand-400">
              curl -H "X-API-Key: {'<your-key>'}" http://localhost:4000/api/agents
            </code>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <button onClick={regenerateApiKey} className="btn-danger flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4" /> Regenerate API Key
            </button>
            <p className="text-xs text-gray-600 mt-2">⚠️ This will invalidate your current key</p>
          </div>
        </div>
      )}
    </div>
  )
}
