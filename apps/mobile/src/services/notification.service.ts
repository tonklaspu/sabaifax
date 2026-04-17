import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { api } from './api.client'

// Lazy import — requires native rebuild
let Notifications: typeof import('expo-notifications') | null = null
try { Notifications = require('expo-notifications') } catch {}

const NOTIF_SETTINGS_KEY = 'sabaifax_notif_settings'

export type NotifKey = 'tax_deadline' | 'budget_exceed' | 'daily_summary' | 'monthly_summary' | 'slip_scan'

export interface NotifSettings {
  tax_deadline: boolean
  budget_exceed: boolean
  daily_summary: boolean
  monthly_summary: boolean
  slip_scan: boolean
}

const DEFAULT_SETTINGS: NotifSettings = {
  tax_deadline: true,
  budget_exceed: true,
  daily_summary: false,
  monthly_summary: true,
  slip_scan: false,
}

// ── Permission ─────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ── Push Token ─────────────────────────────────────

export async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications) return null

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // ใช้ projectId จาก app.json
    })
    return token.data
  } catch {
    return null
  }
}

// ── Settings Persistence ───────────────────────────

export async function loadNotifSettings(): Promise<NotifSettings> {
  const raw = await SecureStore.getItemAsync(NOTIF_SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveNotifSettings(settings: NotifSettings): Promise<void> {
  await SecureStore.setItemAsync(NOTIF_SETTINGS_KEY, JSON.stringify(settings))
  await syncScheduledNotifications(settings)
}

// ── Configure ──────────────────────────────────────

export function configureNotifications() {
  if (!Notifications) return

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'ทั่วไป',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C896',
    })

    Notifications.setNotificationChannelAsync('tax', {
      name: 'ภาษี',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'แจ้งเตือนเกี่ยวกับภาษี',
    })

    Notifications.setNotificationChannelAsync('summary', {
      name: 'สรุปรายวัน/รายเดือน',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'สรุปรายรับรายจ่าย',
    })
  }
}

// ── Schedule Local Notifications ───────────────────

async function syncScheduledNotifications(settings: NotifSettings) {
  if (!Notifications) return

  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync()

  // Tax deadline reminders (before March 31)
  if (settings.tax_deadline) {
    const now = new Date()
    const year = now.getMonth() < 3 ? now.getFullYear() : now.getFullYear() + 1
    const deadline = new Date(year, 2, 31) // March 31

    const reminders = [30, 7, 1] // days before
    for (const daysBefore of reminders) {
      const triggerDate = new Date(deadline)
      triggerDate.setDate(triggerDate.getDate() - daysBefore)
      triggerDate.setHours(9, 0, 0, 0)

      if (triggerDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📅 แจ้งเตือนยื่นภาษี',
            body: `เหลือเวลาอีก ${daysBefore} วัน ก่อนถึงกำหนดยื่นภาษี 31 มี.ค.`,
            data: { type: 'tax_deadline' },
            ...(Platform.OS === 'android' && { channelId: 'tax' }),
          },
          trigger: { type: 'date' as any, date: triggerDate },
        })
      }
    }
  }

  // Daily summary at 21:00
  if (settings.daily_summary) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 สรุปรายวัน',
        body: 'เปิดดูสรุปรายรับ-รายจ่ายประจำวันนี้',
        data: { type: 'daily_summary' },
        ...(Platform.OS === 'android' && { channelId: 'summary' }),
      },
      trigger: {
        type: 'daily' as any,
        hour: 21,
        minute: 0,
      },
    })
  }

  // Monthly summary on last day of month at 20:00
  if (settings.monthly_summary) {
    // Schedule for next month's 1st (close enough to end-of-month)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📆 สรุปรายเดือน',
        body: 'ดูสรุปรายรับ-รายจ่ายเดือนที่ผ่านมา พร้อมเปรียบเทียบ',
        data: { type: 'monthly_summary' },
        ...(Platform.OS === 'android' && { channelId: 'summary' }),
      },
      trigger: {
        type: 'monthly' as any,
        day: 1,
        hour: 20,
        minute: 0,
      },
    })
  }
}

// ── Send Immediate ─────────────────────────────────

export async function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  if (!Notifications) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      ...(Platform.OS === 'android' && { channelId: 'default' }),
    },
    trigger: null, // immediate
  })
}

// ── Register Push Token with Server ────────────────

export async function registerPushTokenWithServer(): Promise<boolean> {
  const token = await getExpoPushToken()
  if (!token) return false

  try {
    await api.post('/push-tokens', {
      token,
      platform: Platform.OS,
    })
    return true
  } catch {
    return false
  }
}

export async function unregisterPushTokenFromServer(): Promise<void> {
  const token = await getExpoPushToken()
  if (!token) return

  try {
    await api.delete(`/push-tokens?token=${encodeURIComponent(token)}`)
  } catch {
    // ignore — token cleanup is best-effort
  }
}

// ── Budget Alert ───────────────────────────────────

export async function checkBudgetAlert(monthlyExpense: number, budget: number) {
  const settings = await loadNotifSettings()
  if (!settings.budget_exceed) return

  const ratio = monthlyExpense / budget
  if (ratio >= 1.0) {
    await sendLocalNotification(
      '⚠️ รายจ่ายเกินเป้า!',
      `รายจ่ายเดือนนี้ ฿${monthlyExpense.toLocaleString()} เกิน Budget ฿${budget.toLocaleString()} แล้ว`,
      { type: 'budget_exceed', ratio },
    )
  } else if (ratio >= 0.8) {
    await sendLocalNotification(
      '⚠️ ใกล้ถึง Budget แล้ว',
      `รายจ่ายเดือนนี้ ฿${monthlyExpense.toLocaleString()} = ${Math.round(ratio * 100)}% ของ Budget`,
      { type: 'budget_exceed', ratio },
    )
  }
}
