import { create } from 'zustand'
import { api } from '../services/api.client'
import { TaxDeduction } from '../utils/tax'

export interface TaxProfile {
  // ── ข้อมูลสำหรับจับคู่ใบกำกับภาษี (e-Tax Invoice) ตามเกณฑ์กรมสรรพากร
  nationalId: string        // เลขบัตรประชาชน 13 หลัก
  address: string           // ที่อยู่ตามบัตรประชาชน

  // ── ส่วนตัว
  hasSpouse: boolean
  children: number          // จำนวนบุตร
  parents: number           // บิดามารดาที่เลี้ยงดู (0–4)

  // ── ประกัน
  lifeInsurance: number     // เบี้ยประกันชีวิต (max 100,000)
  healthInsurance: number   // เบี้ยประกันสุขภาพ (max 25,000)
  parentHealthInsurance: number // ประกันสุขภาพบิดามารดา (max 15,000)

  // ── กองทุน
  providentFund: number     // กองทุนสำรองเลี้ยงชีพ (max 500,000)
  rmf: number               // RMF (max 30% รายได้, max 500,000)
  ssf: number               // SSF (max 30% รายได้, max 200,000)
  socialSecurity: number    // ประกันสังคม (max 9,000)

  // ── สินเชื่อ / บ้าน
  mortgageInterest: number  // ดอกเบี้ยกู้ซื้อบ้าน (max 100,000)

  // ── การใช้จ่าย
  easyEReceipt: number      // Easy E-Receipt (max 50,000)
  donation: number          // เงินบริจาค (max 10% รายได้สุทธิ)
}

interface TaxProfileStore {
  profile: TaxProfile
  loading: boolean
  setField: <K extends keyof TaxProfile>(key: K, value: TaxProfile[K]) => void
  fetchProfile: () => Promise<void>
  saveProfile: () => Promise<void>
  buildDeductions: (grossIncome: number) => TaxDeduction[]
}

const DEFAULT_PROFILE: TaxProfile = {
  nationalId: '',
  address: '',
  hasSpouse: false,
  children: 0,
  parents: 0,
  lifeInsurance: 0,
  healthInsurance: 0,
  parentHealthInsurance: 0,
  providentFund: 0,
  rmf: 0,
  ssf: 0,
  socialSecurity: 9_000,
  mortgageInterest: 0,
  easyEReceipt: 0,
  donation: 0,
}

export const useTaxProfileStore = create<TaxProfileStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  loading: false,

  setField: (key, value) => set((s) => ({ profile: { ...s.profile, [key]: value } })),

  fetchProfile: async () => {
    set({ loading: true })
    try {
      const data = await api.get('/tax/profile')
      if (data) set({ profile: { ...DEFAULT_PROFILE, ...data } })
    } finally {
      set({ loading: false })
    }
  },

  saveProfile: async () => {
    set({ loading: true })
    try {
      await api.put('/tax/profile', get().profile)
    } finally {
      set({ loading: false })
    }
  },

  buildDeductions: (grossIncome) => {
    const p = get().profile
    const deductions: TaxDeduction[] = []

    deductions.push({ id: 'personal', label: 'ค่าลดหย่อนส่วนตัว', category: 'personal', amount: 60_000 })

    if (p.hasSpouse) {
      deductions.push({ id: 'spouse', label: 'คู่สมรส (ไม่มีรายได้)', category: 'spouse', amount: 60_000 })
    }

    if (p.children > 0) {
      deductions.push({
        id: 'child',
        label: `บุตร ${p.children} คน`,
        category: 'child',
        amount: p.children * 30_000,
      })
    }

    if (p.parents > 0) {
      deductions.push({
        id: 'parent',
        label: `เลี้ยงดูบิดามารดา ${p.parents} คน`,
        category: 'parent',
        amount: p.parents * 30_000,
      })
    }

    if (p.lifeInsurance > 0) {
      deductions.push({
        id: 'lifeInsurance',
        label: 'เบี้ยประกันชีวิต',
        category: 'lifeInsurance',
        amount: Math.min(p.lifeInsurance, 100_000),
      })
    }

    if (p.healthInsurance > 0) {
      deductions.push({
        id: 'healthInsurance',
        label: 'เบี้ยประกันสุขภาพ',
        category: 'healthInsurance',
        amount: Math.min(p.healthInsurance, 25_000),
      })
    }

    if (p.parentHealthInsurance > 0) {
      deductions.push({
        id: 'parentHealthInsurance',
        label: 'ประกันสุขภาพบิดามารดา',
        category: 'healthInsurance',
        amount: Math.min(p.parentHealthInsurance, 15_000),
      })
    }

    if (p.socialSecurity > 0) {
      deductions.push({
        id: 'socialSecurity',
        label: 'ประกันสังคม',
        category: 'socialSecurity',
        amount: Math.min(p.socialSecurity, 9_000),
      })
    }

    if (p.providentFund > 0) {
      deductions.push({
        id: 'providentFund',
        label: 'กองทุนสำรองเลี้ยงชีพ (PVD)',
        category: 'providentFund',
        amount: Math.min(p.providentFund, 500_000),
      })
    }

    if (p.rmf > 0) {
      const rmfCap = Math.min(grossIncome * 0.30, 500_000)
      deductions.push({
        id: 'rmf',
        label: 'กองทุน RMF',
        category: 'rmf',
        amount: Math.min(p.rmf, rmfCap),
      })
    }

    if (p.ssf > 0) {
      const ssfCap = Math.min(grossIncome * 0.30, 200_000)
      deductions.push({
        id: 'ssf',
        label: 'กองทุน SSF',
        category: 'ssf',
        amount: Math.min(p.ssf, ssfCap),
      })
    }

    if (p.mortgageInterest > 0) {
      deductions.push({
        id: 'mortgage',
        label: 'ดอกเบี้ยกู้ซื้อบ้าน',
        category: 'mortgage',
        amount: Math.min(p.mortgageInterest, 100_000),
      })
    }

    if (p.easyEReceipt > 0) {
      deductions.push({
        id: 'easyEReceipt',
        label: 'Easy E-Receipt',
        category: 'easyEReceipt',
        amount: Math.min(p.easyEReceipt, 50_000),
      })
    }

    if (p.donation > 0) {
      deductions.push({
        id: 'donation',
        label: 'เงินบริจาค',
        category: 'donation',
        amount: p.donation,
      })
    }

    return deductions
  },
}))
