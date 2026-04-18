import { create } from 'zustand'
import { api } from '../services/api.client'
import { TransactionType } from './transaction.store'

export interface Category {
  id:   string
  label: string
  icon:  string
  type:  TransactionType
  slug?: string | null    // Epic 2 — ใช้จับคู่ auto-categorization
}

// Default categories — ใช้เป็น fallback และค่าเริ่มต้น
const DEFAULT_CATEGORIES: Category[] = [
  // รายจ่าย
  { id: 'exp_food',       label: 'อาหาร',      icon: '🍜', type: 'expense', slug: 'food' },
  { id: 'exp_travel',     label: 'เดินทาง',    icon: '🚗', type: 'expense', slug: 'transport' },
  { id: 'exp_shopping',   label: 'ช้อปปิ้ง',   icon: '🛍️', type: 'expense', slug: 'shopping' },
  { id: 'exp_health',     label: 'สุขภาพ',     icon: '💊', type: 'expense', slug: 'health' },
  { id: 'exp_entertain',  label: 'บันเทิง',    icon: '🎮', type: 'expense', slug: 'entertainment' },
  { id: 'exp_housing',    label: 'ที่พัก',     icon: '🏠', type: 'expense', slug: 'housing' },
  { id: 'exp_utility',    label: 'ค่าน้ำ/ไฟ', icon: '💡', type: 'expense', slug: 'utility' },
  { id: 'exp_other',      label: 'อื่น ๆ',    icon: '📦', type: 'expense', slug: 'other' },
  // รายรับ
  { id: 'inc_salary',     label: 'เงินเดือน',  icon: '💼', type: 'income', slug: 'salary' },
  { id: 'inc_freelance',  label: 'ฟรีแลนซ์',  icon: '💻', type: 'income', slug: 'freelance' },
  { id: 'inc_invest',     label: 'ลงทุน',      icon: '📈', type: 'income', slug: 'invest' },
  { id: 'inc_bonus',      label: 'โบนัส',      icon: '🎁', type: 'income', slug: 'bonus' },
  { id: 'inc_other',      label: 'อื่น ๆ',    icon: '💰', type: 'income', slug: 'other' },
  // โอน
  { id: 'tra_transfer',   label: 'โอนเงิน',   icon: '🔄', type: 'transfer', slug: 'transfer' },
  { id: 'tra_debt',       label: 'ชำระหนี้',  icon: '📋', type: 'transfer', slug: 'debt' },
]

const ICON_OPTIONS = [
  '🍜','🍔','☕','🛒','🚗','✈️','🚌','🏠','💡','💊','🎮','🎬',
  '👗','🛍️','💼','💻','📈','🎁','💰','💵','🔄','📋','📦','⚡',
  '🏋️','📚','🐾','🎵','🎨','🌿',
]

interface CategoryStore {
  categories: Category[]
  iconOptions: string[]
  loading: boolean
  fetchCategories: () => Promise<void>
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: string) => Promise<void>
  getByType: (type: TransactionType) => Category[]
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  iconOptions: ICON_OPTIONS,
  loading: false,

  fetchCategories: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/categories')
      const rows = (res?.data ?? []) as any[]
      if (rows.length > 0) {
        const mapped: Category[] = rows.map(r => ({
          id:    r.id,
          label: r.label ?? r.name ?? '',
          icon:  r.icon ?? '📦',
          type:  r.type,
          slug:  r.slug ?? null,
        }))
        // รวมกับ DEFAULT เผื่อ API ยังไม่มี default บางชนิด
        const existing = new Set(mapped.map(m => `${m.type}:${m.label}`))
        const merged = [
          ...mapped,
          ...DEFAULT_CATEGORIES.filter(d => !existing.has(`${d.type}:${d.label}`)),
        ]
        set({ categories: merged })
      }
    } finally {
      set({ loading: false })
    }
  },

  addCategory: async (cat) => {
    const res = await api.post('/categories', {
      name: cat.label,
      icon: cat.icon,
      type: cat.type,
    })
    const r = (res?.data ?? res) as any
    const row: Category = {
      id:    r.id,
      label: r.label ?? r.name ?? cat.label,
      icon:  r.icon ?? cat.icon,
      type:  r.type ?? cat.type,
    }
    set({ categories: [...get().categories, row] })
  },

  updateCategory: (id, data) => {
    set({
      categories: get().categories.map(c => c.id === id ? { ...c, ...data } : c),
    })
  },

  deleteCategory: async (id) => {
    // ป้องกันลบ default categories
    if (id.startsWith('exp_') || id.startsWith('inc_') || id.startsWith('tra_')) return
    await api.delete(`/categories/${id}`)
    set({ categories: get().categories.filter(c => c.id !== id) })
  },

  getByType: (type) => get().categories.filter(c => c.type === type),
}))
