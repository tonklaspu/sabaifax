import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Epic 4 — Offline Queue
 *
 * เก็บ transaction ที่ parse แล้ว แต่ส่งไม่สำเร็จ (ออฟไลน์/เน็ตหลุด)
 * ใน AsyncStorage — sync ใหม่เมื่อเน็ตกลับมาหรือ app กลับสู่ foreground
 *
 * ── Crash-Safe Design ────────────────────────────────────────
 * ถ้า app ถูก kill ระหว่าง sync (status = 'syncing') แล้วเปิดใหม่:
 *  - ไม่รู้ว่า server รับเข้าสำเร็จแล้วหรือยัง
 *  - วิธีกัน double-post:
 *    1) reset stuck 'syncing' → 'pending' ตอน resumeQueue()
 *    2) รอบถัดไปถ้า server เคยรับแล้ว → response 409 DUPLICATE_SLIP_REF
 *       หรือ 409 POSSIBLE_DUPLICATE → sync worker ตีความว่า 'synced' ทิ้ง
 *    3) Idempotency key (clientTxId) เก็บกันในเครื่อง — ใช้ตรวจภายในด้วย
 */

const QUEUE_KEY = 'sabaifax_offline_tx_queue'
const MAX_ATTEMPTS = 10

export type QueueStatus = 'pending' | 'syncing' | 'failed'

export interface QueuedTransaction {
  clientTxId: string      // uuid สร้างใน client — กัน double post
  status:     QueueStatus
  attempts:   number
  lastError?: string
  createdAt:  number      // epoch ms
  payload: {
    walletId:        string
    categoryId?:     string | null
    toWalletId?:     string
    type:            'expense' | 'income' | 'transfer'
    amount:          number
    note?:           string
    date?:           string
    isTaxDeductible?: boolean
    receiptUrl?:     string
    slipRef?:        string
    bank?:           string
  }
  // meta สำหรับ cleanup หลัง sync สำเร็จ
  assetId?: string        // MediaLibrary asset.id (ไว้ markAssetProcessed)
}

// ── Internal helpers ────────────────────────────────────────

function uuid(): string {
  // RFC4122 v4-ish (ไม่พึ่ง dep) — พอใช้สำหรับ idempotency ภายในเครื่อง
  const r = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
  return `${r()}-${r().slice(0, 4)}-4${r().slice(0, 3)}-${r().slice(0, 4)}-${r()}${r().slice(0, 4)}`
}

async function readAll(): Promise<QueuedTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

async function writeAll(list: QueuedTransaction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list))
}

// ── Public API ──────────────────────────────────────────────

export async function enqueue(
  payload: QueuedTransaction['payload'],
  meta: { assetId?: string } = {},
): Promise<QueuedTransaction> {
  const entry: QueuedTransaction = {
    clientTxId: uuid(),
    status:    'pending',
    attempts:  0,
    createdAt: Date.now(),
    payload,
    assetId:   meta.assetId,
  }
  const list = await readAll()
  list.push(entry)
  await writeAll(list)
  return entry
}

export async function getQueue(): Promise<QueuedTransaction[]> {
  return readAll()
}

export async function getPending(): Promise<QueuedTransaction[]> {
  const list = await readAll()
  return list.filter(e => e.status !== 'failed')
}

export async function setStatus(
  clientTxId: string,
  status: QueueStatus,
  lastError?: string,
): Promise<void> {
  const list = await readAll()
  const idx  = list.findIndex(e => e.clientTxId === clientTxId)
  if (idx < 0) return
  list[idx] = { ...list[idx], status, ...(lastError !== undefined ? { lastError } : {}) }
  await writeAll(list)
}

export async function incrementAttempts(clientTxId: string): Promise<number> {
  const list = await readAll()
  const idx  = list.findIndex(e => e.clientTxId === clientTxId)
  if (idx < 0) return 0
  const attempts = (list[idx].attempts ?? 0) + 1
  list[idx] = {
    ...list[idx],
    attempts,
    status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
  }
  await writeAll(list)
  return attempts
}

export async function remove(clientTxId: string): Promise<void> {
  const list = await readAll()
  await writeAll(list.filter(e => e.clientTxId !== clientTxId))
}

/**
 * Reset รายการที่ค้างสถานะ 'syncing' (app crash ระหว่าง sync)
 * → กลับไปเป็น 'pending' เพื่อให้ sync รอบหน้า retry
 * (ตัว server เองมี Epic 1 duplicate protection กัน double-insert อยู่แล้ว)
 */
export async function recoverStuckSyncing(): Promise<number> {
  const list = await readAll()
  let recovered = 0
  for (const e of list) {
    if (e.status === 'syncing') {
      e.status = 'pending'
      recovered++
    }
  }
  if (recovered > 0) await writeAll(list)
  return recovered
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY)
}
