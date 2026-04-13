import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  setSession: (session: Session | null) => void
  initialize: () => () => void  // returns unsubscribe
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  // เรียกครั้งเดียวตอน App เริ่ม
  initialize: () => {
    // ดึง Session เก่าจาก SecureStore
    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      })
    })

    // Subscribe ฟัง Auth Event เช่น logout, token refresh
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        })
      }
    )

    // Return unsubscribe function
    return () => listener.subscription.unsubscribe()
  },
}))