import { AppState, AppStateStatus } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Lazy imports — native modules require rebuild
let TaskManager: typeof import('expo-task-manager') | null = null
let BackgroundFetch: typeof import('expo-background-fetch') | null = null
let MediaLibrary: typeof import('expo-media-library') | null = null

try { TaskManager = require('expo-task-manager') } catch {}
try { BackgroundFetch = require('expo-background-fetch') } catch {}
try { MediaLibrary = require('expo-media-library') } catch {}

const TASK_NAME = 'SABAIFAX_SLIP_SCAN'
const LAST_CHECK_KEY = 'sabaifax_last_slip_check'

// ── Slip Detection Heuristics ──────────────────────

function looksLikeSlip(filename: string): boolean {
  const lower = filename.toLowerCase()
  const keywords = ['slip', 'receipt', 'transfer', 'payment', 'screenshot', 'สลิป', 'ใบเสร็จ']
  return keywords.some(k => lower.includes(k))
}

// ── Register Background Task ───────────────────────

export function registerBackgroundSlipTask() {
  if (!TaskManager || !BackgroundFetch) return

  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      const newSlips = await checkForNewSlips()

      if (newSlips.length > 0) {
        // Send notification about new slips found
        const { sendLocalNotification, loadNotifSettings } = require('./notification.service')
        const settings = await loadNotifSettings()

        if (settings.slip_scan) {
          await sendLocalNotification(
            '🧾 พบสลิปใหม่',
            `พบ ${newSlips.length} รูปที่อาจเป็นสลิป/ใบเสร็จ — แตะเพื่อสแกน`,
            { type: 'slip_scan', count: newSlips.length },
          )
        }
      }

      return BackgroundFetch!.BackgroundFetchResult.NewData
    } catch {
      return BackgroundFetch!.BackgroundFetchResult.Failed
    }
  })
}

// ── Start/Stop Background Fetch ────────────────────

export async function startBackgroundSlipScan(): Promise<boolean> {
  if (!BackgroundFetch || !MediaLibrary) return false

  // Request media library permission
  const { status } = await MediaLibrary.requestPermissionsAsync()
  if (status !== 'granted') return false

  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60, // every 1 hour
      stopOnTerminate: false,
      startOnBoot: true,
    })
    return true
  } catch {
    return false
  }
}

export async function stopBackgroundSlipScan() {
  if (!BackgroundFetch) return

  const isRegistered = await TaskManager?.isTaskRegisteredAsync(TASK_NAME)
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME)
  }
}

export async function isBackgroundSlipEnabled(): Promise<boolean> {
  if (!TaskManager) return false
  try {
    return await TaskManager.isTaskRegisteredAsync(TASK_NAME)
  } catch {
    return false
  }
}

// ── Check For New Slips ────────────────────────────

export async function checkForNewSlips(): Promise<string[]> {
  if (!MediaLibrary) return []

  // Get last check time
  const lastCheckStr = await SecureStore.getItemAsync(LAST_CHECK_KEY)
  const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(Date.now() - 24 * 60 * 60 * 1000)

  try {
    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      sortBy: [['creationTime', false]],
      first: 50,
      createdAfter: lastCheck.getTime(),
    })

    // Update last check time
    await SecureStore.setItemAsync(LAST_CHECK_KEY, new Date().toISOString())

    // Filter assets that look like slips (by filename or recent screenshots)
    const slipAssets = assets.filter(asset => {
      if (looksLikeSlip(asset.filename)) return true
      // Screenshots taken in the last hour are candidates
      const age = Date.now() - asset.creationTime
      if (age < 3600000 && asset.filename.toLowerCase().includes('screen')) return true
      return false
    })

    return slipAssets.map(a => a.uri)
  } catch {
    return []
  }
}

// ── Foreground Listener (optional) ─────────────────

let appStateSubscription: any = null

export function startForegroundSlipListener() {
  if (appStateSubscription) return

  appStateSubscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
    if (state === 'active') {
      // Check when app comes to foreground
      const slips = await checkForNewSlips()
      if (slips.length > 0) {
        const { sendLocalNotification, loadNotifSettings } = require('./notification.service')
        const settings = await loadNotifSettings()
        if (settings.slip_scan) {
          await sendLocalNotification(
            '🧾 พบสลิปใหม่',
            `พบ ${slips.length} รูปใหม่ที่อาจเป็นสลิป — เปิดแอปเพื่อสแกน`,
            { type: 'slip_scan', count: slips.length },
          )
        }
      }
    }
  })
}

export function stopForegroundSlipListener() {
  if (appStateSubscription) {
    appStateSubscription.remove()
    appStateSubscription = null
  }
}
