import { create } from 'zustand'
import { api } from '../services/api.client'
import {
  TaxDeduction,
  TaxResult,
  DEFAULT_DEDUCTIONS,
  calculateThai,
} from '../utils/tax'

interface TaxStore {
  grossIncome: number
  deductions: TaxDeduction[]
  result: TaxResult | null
  loading: boolean

  deductionUsed: number
  deductionLimit: number

  setGrossIncome: (income: number) => void
  addDeduction: (d: TaxDeduction) => void
  updateDeduction: (id: string, amount: number) => void
  removeDeduction: (id: string) => void
  compute: () => void
  fetchTaxSummary: () => Promise<void>
}

export const useTaxStore = create<TaxStore>((set, get) => ({
  grossIncome: 0,
  deductions: DEFAULT_DEDUCTIONS,
  result: null,
  loading: false,

  deductionUsed: 0,
  deductionLimit: 130000,

  setGrossIncome: (income) => {
    set({ grossIncome: income })
    get().compute()
  },

  addDeduction: (d) => {
    set((s) => ({ deductions: [...s.deductions, d] }))
    get().compute()
  },

  updateDeduction: (id, amount) => {
    set((s) => ({
      deductions: s.deductions.map((d) => d.id === id ? { ...d, amount } : d),
    }))
    get().compute()
  },

  removeDeduction: (id) => {
    set((s) => ({ deductions: s.deductions.filter((d) => d.id !== id) }))
    get().compute()
  },

  compute: () => {
    const { grossIncome, deductions } = get()
    const result = calculateThai(grossIncome, deductions)
    const used = deductions.reduce((sum, item) => sum + item.amount, 0)
    set({ result, deductionUsed: used })
  },

  fetchTaxSummary: async () => {
    set({ loading: true })
    try {
      const { grossIncome, deductions } = get()
      const data = await api.post('/tax/calculate', { grossIncome, deductions })
      if (data?.deductions && data.deductions.length > 0) {
        set({ deductions: data.deductions as TaxDeduction[] })
      }
      get().compute()
    } finally {
      set({ loading: false })
    }
  },
}))
