import { AppState, AppStateStatus } from 'react-native'
import { api } from './api.client'

// Lazy import — NetInfo เป็น optional ถ้ายังไม่ได้ install ก็ทำงานต่อได้
// (fallback: try-send ตรงๆ ถ้า fail = offline)
interface NetInfoLike {
  fetch: () => Promise<{ isConnected: boolean | null; isInternetReachable: boolean | null }>
  addEventListener: (
    cb: (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void,
  ) => () => void
}
let NetInfo: NetInfoLike | null = null
try { NetInfo = require('@react-native-community/netinfo').default } catch {}
import { markAssetProcessed } from './processed-assets.service'
import {
  getPending,
  setStatus,
  incrementAttempts,
  remove,
  recoverStuckSyncing,
  QueuedTransaction,
} from './offline-queue.service'

/**
 * Epic 4 — Sync Worker
 *
 * รับผิดชอบ:
 *  1) เรียก syncNow() เมื่อ:
 *     - app กลับสู่ foreground (AppState 'active')
 *     - มี network เชื่อมต่อกลับมา (NetInfo)
 *     - user กด save แล้ว (เช็กก่อนว่ามี pending ค้างอยู่ไหม)
 *  2) ป้องกัน concurrent syncs ด้วย module-level lock
 *  3) ถือเสมอว่า 409 duplicate = success (server เห็นซ้ำ = เคยรับไปแล้ว)
 */

let isRunning = false
let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null
let netInfoUnsub: (() => void) | null = null

// ── Core sync logic ──────────────────────────────────────────

async function syncOne(entry: QueuedTransaction): Promise<boolean> {
  await setStatus(entry.clientTxId, 'syncing')

  try {
    const res = await api.postRaw('/transactions', {
      ...entry.payload,
      // force=true สำหรับ retry — เราพยายามส่งจาก queue แสดงว่าผู้ใช้ตั้งใจบันทึกแล้ว
      // แต่ยังพึ่งพา slipRef unique ของ server กัน duplicate จริง
      force: entry.attempts > 0,
    })

    // ── 2xx — สำเร็จ ──
    if (res.ok) {
      if (entry.assetId) {
        await markAssetProcessed(entry.assetId).catch(() => {})
      }
      await remove(entry.clientTxId)
      return true
    }

    // ── 409 duplicate — ถือว่าเคยบันทึกไปแล้ว ล้างออกจาก queue ──
    if (
      res.status === 409 &&
      (res.data?.error === 'DUPLICATE_SLIP_REF' || res.data?.error === 'POSSIBLE_DUPLICATE')
    ) {
      console.log('[sync] treating 409 as already-synced:', entry.clientTxId)
      if (entry.assetId) {
        await markAssetProcessed(entry.assetId).catch(() => {})
      }
      await remove(entry.clientTxId)
      return true
    }

    // ── 4xx อื่นๆ — client error ไม่ควร retry ตลอดไป ──
    if (res.status >= 400 && res.status < 500) {
      await setStatus(entry.clientTxId, 'failed', `HTTP ${res.status}: ${res.data?.message ?? ''}`)
      return false
    }

    // ── 5xx / network — retry ต่อ ──
    await incrementAttempts(entry.clientTxId)
    await setStatus(entry.clientTxId, 'pending', res.data?.message ?? `HTTP ${res.status}`)
    return false
  } catch (err: any) {
    // Network error — retry ในรอบหน้า
    await incrementAttempts(entry.clientTxId)
    await setStatus(entry.clientTxId, 'pending', err?.message ?? 'Network error')
    return false
  }
}

export async function syncNow(): Promise<{ synced: number; failed: number; total: number }> {
  if (isRunning) {
    return { synced: 0, failed: 0, total: 0 }
  }
  isRunning = true

  let synced = 0
  let failed = 0
  try {
    // Recover rows ค้างสถานะ 'syncing' ก่อน (จาก app crash รอบก่อน)
    await recoverStuckSyncing()

    const pending = await getPending()
    if (pending.length === 0) return { synced: 0, failed: 0, total: 0 }

    // Check network ก่อนลุย (ลด noise retries)
    if (NetInfo) {
      const net = await NetInfo.fetch()
      if (!net.isConnected || net.isInternetReachable === false) {
        return { synced: 0, failed: 0, total: pending.length }
      }
    }
    // ถ้าไม่มี NetInfo — try-send ตรงๆ ถ้า fail = offline ส่งกลับเข้า queue

    for (const entry of pending) {
      const ok = await syncOne(entry)
      if (ok) synced++
      else    failed++
    }
    return { synced, failed, total: pending.length }
  } finally {
    isRunning = false
  }
}

// ── Lifecycle: register/unregister listeners ─────────────────

/**
 * เรียกใน `_layout.tsx` หลัง user login
 * — sync ทันทีหนึ่งรอบ + subscribe AppState และ NetInfo
 */
export async function startSyncWorker(): Promise<void> {
  // Recover ก่อนเสมอ — กัน stuck ตั้งแต่ boot
  await recoverStuckSyncing().catch(() => {})

  // Trigger sync แรกถ้ามี pending
  syncNow().catch(err => console.warn('[sync] initial sync failed:', err))

  // AppState listener
  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        syncNow().catch(err => console.warn('[sync] onActive failed:', err))
      }
    })
  }

  // NetInfo listener — sync ทันทีเมื่อเน็ตกลับ (ข้ามถ้าไม่มี NetInfo)
  if (NetInfo && !netInfoUnsub) {
    netInfoUnsub = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncNow().catch(err => console.warn('[sync] onConnected failed:', err))
      }
    })
  }
}

export function stopSyncWorker(): void {
  if (appStateSub) {
    appStateSub.remove()
    appStateSub = null
  }
  if (netInfoUnsub) {
    netInfoUnsub()
    netInfoUnsub = null
  }
}
