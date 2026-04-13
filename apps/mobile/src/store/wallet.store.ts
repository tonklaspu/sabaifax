import { create } from 'zustand'
import { supabase } from '../services/supabase'

interface WalletStore {
  totalBalance: number
  wallets: any[]
  loading: boolean
  fetchWallets: () => Promise<void>
}

export const useWalletStore = create<WalletStore>((set) => ({
  totalBalance: 0,
  wallets: [],
  loading: false,

  fetchWallets: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
      if (error) throw error
      const total = (data ?? []).reduce((sum, w) => sum + w.balance, 0)
      set({ wallets: data ?? [], totalBalance: total })
    } finally {
      set({ loading: false })
    }
  },
}))