import '../global.css'
import { useEffect, useRef, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import * as SecureStore from 'expo-secure-store'
// 📌 1. Import useRootNavigationState เพิ่มเข้ามา
import { Slot, router, useSegments, useRootNavigationState } from 'expo-router'
import { useAuthStore } from '../src/store/auth.store'
import { useWalletStore } from '../src/store/wallet.store'
import { useCategoryStore } from '../src/store/category.store'
import { useBudgetStore } from '../src/store/budget.store'
import { Colors } from '../src/constants'
import { configureNotifications, registerPushTokenWithServer, loadNotifSettings } from '../src/services/notification.service'
import {
  registerBackgroundSlipTask,
  startForegroundSlipListener,
  stopForegroundSlipListener,
} from '../src/services/background-slip.service'
import { startSyncWorker, stopSyncWorker } from '../src/services/sync-worker.service'

registerBackgroundSlipTask()

export default function RootLayout() {
  const initialize      = useAuthStore(s => s.initialize)
  const loading         = useAuthStore(s => s.loading)
  const session         = useAuthStore(s => s.session)
  const fetchWallets    = useWalletStore(s => s.fetchWallets)
  const fetchCategories = useCategoryStore(s => s.fetchCategories)
  const fetchBudget     = useBudgetStore(s => s.fetchBudget)
  const segments        = useSegments()
  
  // 📌 2. ประกาศตัวแปรเช็กสถานะ Navigation
  const rootNavigationState = useRootNavigationState()
  const didFetch        = useRef(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    const unsubscribe = initialize()
    configureNotifications()
    SecureStore.getItemAsync('hasSeenOnboarding')
      .then(v => setHasSeenOnboarding(v === 'true'))
      .catch(() => setHasSeenOnboarding(false))
      .finally(() => setOnboardingChecked(true))
    return unsubscribe
  }, [])

  useEffect(() => {
    // 📌 3. เช็กว่าระบบโหลดข้อมูลจาก Store เสร็จหรือยัง
    if (loading) return
    if (!onboardingChecked) return

    // 📌 4. 🚨 ด่านสำคัญ: รอให้ระบบ Navigation ของ Expo สร้างเสร็จ 100% ก่อนค่อยทำอย่างอื่น
    if (!rootNavigationState?.key) return

    const inApp        = segments[0] === '(app)'
    const inAuth       = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!hasSeenOnboarding && !inOnboarding) {
      router.replace('/onboarding')
      return
    }

    if (!session && !inAuth) {
      didFetch.current = false
      stopForegroundSlipListener()
      stopSyncWorker()
      router.replace('/(auth)/login')
    } else if (session && !inApp) {
      router.replace('/(app)')
    } else if (session && inApp && !didFetch.current) {
      didFetch.current = true
      fetchWallets()
      fetchCategories()
      fetchBudget()
      registerPushTokenWithServer()
      loadNotifSettings()
        .then(s => { if (s.slip_scan) startForegroundSlipListener() })
        .catch(err => console.warn('[slip_scan] load settings failed:', err))
      startSyncWorker().catch(err => console.warn('[sync] startSyncWorker failed:', err))
    }
  // ใช้ session?.user?.id (user เปลี่ยนเฉพาะตอน login/logout) แทน access_token
  // ที่ refresh ทุกชั่วโมง → ป้องกัน refetch ซ้ำซ้อน
  }, [session?.user?.id, loading, segments[0], rootNavigationState?.key, onboardingChecked, hasSeenOnboarding])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.navy[800] }}>
      <Slot />
      {loading && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: Colors.navy[800],
          alignItems: 'center', justifyContent: 'center',
        }}>
          <ActivityIndicator color={Colors.emerald[500]} size="large" />
        </View>
      )}
    </View>
  )
}