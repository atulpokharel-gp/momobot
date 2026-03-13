import { create } from 'zustand'

export const useAgentStore = create((set, get) => ({
  agents: [],
  selectedAgent: null,
  loading: false,

  setAgents: (agents) => set({ agents }),

  updateAgentStatus: (agentId, status, extra = {}) => {
    set(state => ({
      agents: state.agents.map(a =>
        a.id === agentId ? { ...a, status, isLive: status === 'online', ...extra } : a
      )
    }))
  },

  addAgent: (agent) => {
    set(state => ({ agents: [agent, ...state.agents] }))
  },

  removeAgent: (agentId) => {
    set(state => ({ agents: state.agents.filter(a => a.id !== agentId) }))
  },

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setLoading: (loading) => set({ loading })
}))
