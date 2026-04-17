import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

// SecureStore มีลิมิต 2048 bytes ต่อค่า — Supabase session (JWT + refresh) เกินบ่อย
// ใช้ chunked adapter: แบ่งค่าเป็นชิ้น ๆ ชิ้นละ ~1800 bytes
const CHUNK_SIZE = 1800

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const meta = await SecureStore.getItemAsync(key)
    if (!meta) return null
    // ถ้าเป็นค่าเดี่ยว (ไม่ได้แบ่ง) → คืนตรง ๆ
    if (!meta.startsWith('__chunked__:')) return meta
    const count = Number(meta.split(':')[1])
    const parts: string[] = []
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`)
      if (part == null) return null
      parts.push(part)
    }
    return parts.join('')
  },

  setItem: async (key: string, value: string) => {
    // เคลียร์ chunks เก่าก่อน (เผื่อเปลี่ยนจากยาว → สั้น)
    const prev = await SecureStore.getItemAsync(key)
    if (prev?.startsWith('__chunked__:')) {
      const prevCount = Number(prev.split(':')[1])
      for (let i = 0; i < prevCount; i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`)
      }
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value)
      return
    }

    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    await Promise.all(
      chunks.map((c, i) => SecureStore.setItemAsync(`${key}.${i}`, c)),
    )
    await SecureStore.setItemAsync(key, `__chunked__:${chunks.length}`)
  },

  removeItem: async (key: string) => {
    const meta = await SecureStore.getItemAsync(key)
    if (meta?.startsWith('__chunked__:')) {
      const count = Number(meta.split(':')[1])
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`)
      }
    }
    await SecureStore.deleteItemAsync(key)
  },
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})