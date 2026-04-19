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

const normalizeTx = (t: any): Transaction => ({ ...t, amount: Number(t?.amount) || 0 })
const normalizeList = (rows: any[]): Transaction[] => (rows ?? []).map(normalizeTx)

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
      set({ recentTransactions: normalizeList(res?.data) })
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
      set({ allTransactions: normalizeList(res?.data) })
    } finally {
      set({ loadingAll: false })
    }
  },

  createTransaction: async (data) => {
    const d = data as any
    const body: any = {
      type:   d.type,
      amount: d.amount,
      note:   d.note,
      date:   d.date,
      walletId:   d.walletId   ?? d.wallet_id,
      toWalletId: d.toWalletId ?? d.to_wallet_id,
      categoryId: d.categoryId ?? d.category_id,
      isTaxDeductible: d.isTaxDeductible ?? d.is_tax_deductible,
      receiptUrl: d.receiptUrl ?? d.receipt_url,
      slipRef: d.slipRef,
      bank: d.bank,
      force: d.force,
    }
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k])
    const res = await api.post('/transactions', body)
    const row = normalizeTx(res?.data ?? res)
    const updated = [row, ...get().recentTransactions].slice(0, 10)
    set({ recentTransactions: updated })
    // refresh wallet balances (computed server-side จาก transactions)
    const { useWalletStore } = await import('./wallet.store')
    useWalletStore.getState().fetchWallets().catch(() => {})
  },

  updateTransaction: async (id, data) => {
    const res = await api.put(`/transactions/${id}`, {
      type: data.type,
      amount: data.amount,
      note: data.note,
      date: data.date,
      walletId: data.wallet_id,
    })
    const updated = normalizeTx(res?.data ?? res)
    set({
      recentTransactions: get().recentTransactions.map(t => t.id === id ? { ...t, ...updated } : t),
      allTransactions: get().allTransactions.map(t => t.id === id ? { ...t, ...updated } : t),
    })
    const { useWalletStore } = await import('./wallet.store')
    useWalletStore.getState().fetchWallets().catch(() => {})
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`)
    set({
      recentTransactions: get().recentTransactions.filter(t => t.id !== id),
      allTransactions: get().allTransactions.filter(t => t.id !== id),
    })
    const { useWalletStore } = await import('./wallet.store')
    useWalletStore.getState().fetchWallets().catch(() => {})
  },
}))
