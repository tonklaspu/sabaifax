import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../src/constants'

export default function AuthCallbackScreen() {
  useEffect(() => {
    // Supabase onAuthStateChange ใน _layout.tsx จะจัดการ redirect ให้
    // รอสักครู่แล้ว fallback ไป login
    const timeout = setTimeout(() => {
      router.replace('/(auth)/login')
    }, 2000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.navy[800], alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.emerald[500]} size="large" />
    </View>
  )
}
