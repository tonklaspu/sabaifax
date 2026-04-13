import { useEffect } from 'react'
import { Slot } from 'expo-router'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/auth.store'

export default function AppLayout() {
  const { session, loading } = useAuthStore()

  useEffect(() => {
    // ถ้ายังไม่ Login ไม่ให้เข้า App
    if (!loading && !session) {
      router.replace('/(auth)/login')
    }
  }, [session, loading])

  return <Slot />
}