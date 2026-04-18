import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Epic 1 — Layer 1: กันไม่ให้สแกนรูปใน MediaLibrary ตัวเดิมซ้ำ
 *
 * เก็บ `Set<assetId>` ที่เคยประมวลผลแล้ว (จาก background scan หรือ manual)
 * — ใช้ AsyncStorage (SecureStore มี limit 2KB ไม่พอสำหรับ list)
 * — จำกัดไว้ 2000 ids (FIFO) เพื่อไม่ให้โตไม่มีที่สิ้นสุด
 */

const KEY      = 'sabaifax_processed_assets'
const MAX_SIZE = 2000

let cache: string[] | null = null

async function load(): Promise<string[]> {
  if (cache) return cache
  try {
    const raw = await AsyncStorage.getItem(KEY)
    cache = raw ? JSON.parse(raw) : []
  } catch {
    cache = []
  }
  return cache!
}

async function persist(list: string[]): Promise<void> {
  cache = list
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list))
  } catch (err) {
    console.warn('[processed-assets] persist failed:', err)
  }
}

export async function isAssetProcessed(id: string): Promise<boolean> {
  const list = await load()
  return list.includes(id)
}

export async function markAssetProcessed(id: string): Promise<void> {
  if (!id) return
  const list = await load()
  if (list.includes(id)) return
  list.push(id)
  // FIFO trim
  const trimmed = list.length > MAX_SIZE ? list.slice(-MAX_SIZE) : list
  await persist(trimmed)
}

export async function markManyProcessed(ids: string[]): Promise<void> {
  if (!ids.length) return
  const list = await load()
  const set  = new Set(list)
  ids.forEach(id => set.add(id))
  const merged  = Array.from(set)
  const trimmed = merged.length > MAX_SIZE ? merged.slice(-MAX_SIZE) : merged
  await persist(trimmed)
}

/** filter list ของ asset ออกเฉพาะตัวที่ยังไม่เคยถูก process */
export async function filterUnprocessed<T extends { id: string }>(assets: T[]): Promise<T[]> {
  const list = await load()
  const set  = new Set(list)
  return assets.filter(a => !set.has(a.id))
}

export async function clearProcessedAssets(): Promise<void> {
  cache = []
  await AsyncStorage.removeItem(KEY)
}
