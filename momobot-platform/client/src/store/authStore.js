import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('momobot_user') || 'null'),
  accessToken: localStorage.getItem('momobot_token') || null,
  refreshToken: localStorage.getItem('momobot_refresh') || null,
  isAuthenticated: !!localStorage.getItem('momobot_token'),
  loading: false,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('momobot_token', accessToken)
    localStorage.setItem('momobot_refresh', refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  setUser: (user) => {
    localStorage.setItem('momobot_user', JSON.stringify(user))
    set({ user })
  },

  login: async (email, password, totpCode) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/login', { email, password, totpCode })
      const { accessToken, refreshToken, user, requiresTOTP } = res.data

      if (requiresTOTP) {
        set({ loading: false })
        return { requiresTOTP: true }
      }

      get().setTokens(accessToken, refreshToken)
      get().setUser(user)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  register: async (email, username, password) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/register', { email, username, password })
      const { accessToken, refreshToken, user } = res.data
      get().setTokens(accessToken, refreshToken)
      get().setUser(user)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      const refreshToken = get().refreshToken
      await api.post('/auth/logout', { refreshToken })
    } catch (_) {}
    localStorage.removeItem('momobot_token')
    localStorage.removeItem('momobot_refresh')
    localStorage.removeItem('momobot_user')
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken
    if (!refreshToken) return false
    try {
      const res = await api.post('/auth/refresh', { refreshToken })
      const { accessToken, refreshToken: newRefresh } = res.data
      get().setTokens(accessToken, newRefresh)
      return true
    } catch (_) {
      get().logout()
      return false
    }
  }
}))
