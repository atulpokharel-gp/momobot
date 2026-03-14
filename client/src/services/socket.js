import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

let socket = null

export function getSocket() {
  return socket
}

export function connectSocket() {
  if (socket?.connected) return socket

  const token = useAuthStore.getState().accessToken

  socket = io('http://localhost:4000/client', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected to server')
  })

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] ⚠️ Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] ❌ Connection error:', err.message || err)
  })

  socket.on('error', (err) => {
    console.error('[Socket] ❌ Error:', err)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
