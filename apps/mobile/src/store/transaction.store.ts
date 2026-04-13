import { create } from 'zustand'
import { supabase } from '../services/supabase'

interface TransactionStore {
  recentTransactions: any[]
  monthlyIncome: number
  monthlyExpense: number
  loading: boolean
  fetchRecent: () => Promise<void>
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  recentTransactions: [],
  monthlyIncome: 0,
  monthlyExpense: 0,
  loading: false,

  fetchRecent: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      set({ recentTransactions: data ?? [] })
    } finally {
      set({ loading: false })
    }
  },
}))