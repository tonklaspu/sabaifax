import { create } from 'zustand'
import { api } from '../services/api.client'

export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Transaction {
  id: string
  user_id: string
  wallet_id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string
  created_at: string
}

interface TransactionStore {
  recentTransactions: Transaction[]
  allTransactions: Transaction[]
  monthlyIncome: number
  monthlyExpense: number
  loading: boolean
  loadingAll: boolean
  fetchRecent: () => Promise<void>
  selectedYear: number
  selectedMonth: number
  setSelectedMonth: (year: number, month: number) => void
  fetchMonthlySummary: (year?: number, month?: number) => Promise<void>
  fetchAll: (filters?: { type?: TransactionType | 'all'; year?: number; month?: number }) => Promise<void>
  createTransaction: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateTransaction: (id: string, data: Partial<Pick<Transaction, 'type' | 'amount' | 'note' | 'date' | 'wallet_id' | 'category'>>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  recentTransactions: [],
  allTransactions: [],
  monthlyIncome: 0,
  monthlyExpense: 0,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  loading: false,
  loadingAll: false,

  setSelectedMonth: (year, month) => {
    set({ selectedYear: year, selectedMonth: month })
    get().fetchMonthlySummary(year, month)
  },

  fetchRecent: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/transactions?limit=10&sort=created_at:desc')
      set({ recentTransactions: res?.data ?? [] })
    } finally {
      set({ loading: false })
    }
  },

  fetchMonthlySummary: async (year, month) => {
    const s = get()
    const y = year  ?? s.selectedYear
    const m = month ?? s.selectedMonth
    const from = new Date(y, m - 1, 1).toISOString()
    const to   = new Date(y, m, 0, 23, 59, 59).toISOString()
    const params = new URLSearchParams({ from, to, limit: '1000' })
    const res = await api.get(`/transactions?${params.toString()}`)
    const rows: Transaction[] = res?.data ?? []
    let income = 0, expense = 0
    for (const t of rows) {
      const amt = Number(t.amount) || 0
      if (t.type === 'income')  income  += amt
      if (t.type === 'expense') expense += amt
    }
    set({ monthlyIncome: income, monthlyExpense: expense })
  },

  fetchAll: async (filters = {}) => {
    set({ loadingAll: true })
    try {
      const params = new URLSearchParams({ sort: 'date:desc' })
      if (filters.type && filters.type !== 'all') {
        params.set('type', filters.type)
      }
      if (filters.year && filters.month) {
        const from = new Date(filters.year, filters.month - 1, 1).toISOString()
        const to   = new Date(filters.year, filters.month, 0, 23, 59, 59).toISOString()
        params.set('from', from)
        params.set('to', to)
      }
      const res = await api.get(`/transactions?${params.toString()}`)
      set({ allTransactions: res?.data ?? [] })
    } finally {
      set({ loadingAll: false })
    }
  },

  createTransaction: async (data) => {
    const res = await api.post('/transactions', data)
    const row: Transaction = res?.data ?? res
    const updated = [row, ...get().recentTransactions].slice(0, 10)
    set({ recentTransactions: updated })
  },

  updateTransaction: async (id, data) => {
    const res = await api.put(`/transactions/${id}`, {
      type: data.type,
      amount: data.amount,
      note: data.note,
      date: data.date,
      walletId: data.wallet_id,
    })
    const updated = res?.data ?? res
    set({
      recentTransactions: get().recentTransactions.map(t => t.id === id ? { ...t, ...updated } : t),
      allTransactions: get().allTransactions.map(t => t.id === id ? { ...t, ...updated } : t),
    })
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`)
    set({
      recentTransactions: get().recentTransactions.filter(t => t.id !== id),
      allTransactions: get().allTransactions.filter(t => t.id !== id),
    })
  },
}))
