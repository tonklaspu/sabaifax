import { create } from 'zustand'
import { api } from '../services/api.client'

export interface Wallet {
  id: string
  user_id: string
  name: string
  type: 'cash' | 'bank' | 'credit' | 'savings' | 'investment' | 'other'
  balance: number
  color: string
  icon: string
  created_at: string
}

interface WalletStore {
  wallets: Wallet[]
  totalBalance: number
  loading: boolean
  error: string | null
  fetchWallets: () => Promise<void>
  createWallet: (data: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateWallet: (id: string, data: Partial<Wallet>) => Promise<void>
  deleteWallet: (id: string) => Promise<void>
}

const calcTotal = (wallets: Wallet[]) =>
  wallets.reduce((sum, w) => sum + (Number(w.balance) ?? 0), 0)

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  totalBalance: 0,
  loading: false,
  error: null,

  fetchWallets: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/wallets')
      const wallets: Wallet[] = res.data ?? []
      set({ wallets, totalBalance: calcTotal(wallets) })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  createWallet: async (data) => {
    set({ error: null })
    try {
      const res = await api.post('/wallets', data)
      const wallet: Wallet = res.data
      const wallets = [...get().wallets, wallet]
      set({ wallets, totalBalance: calcTotal(wallets) })
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  updateWallet: async (id, data) => {
    set({ error: null })
    try {
      const res = await api.put(`/wallets/${id}`, data)
      const updated: Wallet = res.data
      const wallets = get().wallets.map(w => w.id === id ? updated : w)
      set({ wallets, totalBalance: calcTotal(wallets) })
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  deleteWallet: async (id) => {
    set({ error: null })
    try {
      await api.delete(`/wallets/${id}`)
      const wallets = get().wallets.filter(w => w.id !== id)
      set({ wallets, totalBalance: calcTotal(wallets) })
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },
}))