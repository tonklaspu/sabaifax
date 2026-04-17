import { create } from 'zustand'
import { api } from '../services/api.client'

interface BudgetStore {
  monthlyLimit: number
  loading: boolean
  fetchBudget: () => Promise<void>
  updateBudget: (limit: number) => Promise<void>
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  monthlyLimit: 0,
  loading: false,

  fetchBudget: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/budget')
      const data = res?.data
      if (data) {
        set({ monthlyLimit: Number(data.monthlyLimit ?? data.monthly_limit) || 0 })
      }
    } finally {
      set({ loading: false })
    }
  },

  updateBudget: async (limit) => {
    const res = await api.put('/budget', { monthlyLimit: limit })
    const data = res?.data
    if (data) {
      set({ monthlyLimit: Number(data.monthlyLimit ?? data.monthly_limit) || 0 })
    }
  },
}))
