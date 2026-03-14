import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, CpuChipIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [requiresTOTP, setRequiresTOTP] = useState(false)
  const [credentials, setCredentials] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm()
  const { register: registerTOTP, handleSubmit: handleTOTPSubmit } = useForm()

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password)
      if (result.requiresTOTP) {
        setRequiresTOTP(true)
        setCredentials(data)
        toast('Enter your 2FA code', { icon: '🔐' })
        return
      }
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    }
  }

  const onTOTPSubmit = async (data) => {
    try {
      await login(credentials.email, credentials.password, data.totpCode)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid 2FA code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/50">
            <CpuChipIcon className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MomoBot Platform</h1>
          <p className="text-gray-500 mt-1 text-sm">Agentic automation for your local machines</p>
        </div>

        <div className="card">
          {!requiresTOTP ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    {...register('email', { required: 'Email required' })}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input pr-12"
                      placeholder="••••••••"
                      {...register('password', { required: 'Password required' })}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔐</div>
                <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
                <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>

              <form onSubmit={handleTOTPSubmit(onTOTPSubmit)} className="space-y-4">
                <input
                  type="text"
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  {...registerTOTP('totpCode', { required: true, minLength: 6, maxLength: 6 })}
                />
                <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button type="button" className="btn-ghost w-full" onClick={() => setRequiresTOTP(false)}>
                  Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
