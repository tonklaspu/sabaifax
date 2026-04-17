import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { api } from '../services/api.client'

export interface ProfileUpdate {
  username?: string
  firstName?: string
  lastName?: string
}

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  setSession: (session: Session | null) => void
  initialize: () => () => void  // returns unsubscribe
  updateProfile: (profile: ProfileUpdate) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  // เรียกครั้งเดียวตอน App เริ่ม
  initialize: () => {
  // ← set loading = true ก่อน
  set({ loading: true })

  supabase.auth.getSession().then(({ data }) => {
    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,  // ← loading = false หลังได้ session
    })
  })

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      })
    }
  )

  return () => listener.subscription.unsubscribe()},

  updateProfile: async (profile) => {
    const username  = profile.username?.trim()
    const firstName = profile.firstName?.trim()
    const lastName  = profile.lastName?.trim()
    const fullName  = [firstName, lastName].filter(Boolean).join(' ')

    // บันทึกลง profiles ก่อน (เช็ค username ซ้ำ)
    await api.put('/profile', {
      username,
      firstName,
      lastName,
    })

    // sync ไปยัง Supabase user_metadata — ให้ derive display บน client ได้ทันที
    const { data, error } = await supabase.auth.updateUser({
      data: {
        username,
        first_name: firstName,
        last_name:  lastName,
        full_name:  fullName || undefined,
      },
    })
    if (error) throw error

    set({ user: data.user })
  },

  logout: () => {
    supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))