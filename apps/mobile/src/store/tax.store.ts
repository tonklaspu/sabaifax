import { create } from 'zustand'
import { supabase } from '../services/supabase'
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

  // 1. เพิ่มตัวแปรที่หน้าจอ Dashboard ต้องการ
  deductionUsed: number
  deductionLimit: number

  setGrossIncome: (income: number) => void
  addDeduction: (d: TaxDeduction) => void
  updateDeduction: (id: string, amount: number) => void
  removeDeduction: (id: string) => void
  compute: () => void
  fetchFromSupabase: () => Promise<void>
  
  // 2. เพิ่มฟังก์ชันที่หน้าจอต้องการ
  fetchTaxSummary: () => Promise<void> 
}

export const useTaxStore = create<TaxStore>((set, get) => ({
  grossIncome: 0,
  deductions: DEFAULT_DEDUCTIONS,
  result: null,
  loading: false,

  // 3. กำหนดค่าเริ่มต้นให้เพดานภาษี (เช่น 130,000 บาท ตามดีไซน์)
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
    
    // 4. ให้มันบวกเลขยอดลดหย่อนทั้งหมดมารวมกัน เพื่อส่งไปให้หน้าจอแสดงผลในหลอด Progress Bar
    const used = deductions.reduce((sum, item) => sum + item.amount, 0)
    
    set({ result, deductionUsed: used })
  },

  fetchFromSupabase: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('tax_deductions')
        .select('id, label, category, amount')
      if (error) throw error
      if (data && data.length > 0) {
        set({ deductions: data as TaxDeduction[] })
      }
      get().compute()
    } finally {
      set({ loading: false })
    }
  },

  // 5. ทำทางลัดให้ฟังก์ชันที่หน้าจอเรียกใช้งาน วิ่งมาใช้ fetchFromSupabase แทน
  fetchTaxSummary: async () => {
    await get().fetchFromSupabase()
  }
}))