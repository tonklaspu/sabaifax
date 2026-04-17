import { supabase } from './supabase'
import * as Linking from 'expo-linking'

const API_URL = process.env.EXPO_PUBLIC_API_URL

async function resolveEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) return trimmed.toLowerCase()
  // เป็น username → lookup email จาก API
  const res = await fetch(`${API_URL}/auth/lookup?username=${encodeURIComponent(trimmed)}`)
  if (!res.ok) throw new Error('ไม่พบชื่อผู้ใช้นี้')
  const body = await res.json()
  if (!body?.email) throw new Error('ไม่พบชื่อผู้ใช้นี้')
  return body.email
}

export const authService = {
  // Login ด้วย Email หรือ Username + Password
  login: async (identifier: string, password: string) => {
    const email = await resolveEmail(identifier)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Login ด้วย Google (deep link กลับมาที่แอป)
  loginWithGoogle: async () => {
    // lazy import เพื่อไม่ crash ถ้า native module ยังไม่ได้ build
    const WebBrowser = await import('expo-web-browser')
    const redirectTo = Linking.createURL('/auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'success' && result.url) {
        const { params } = Linking.parse(result.url)
        if (params?.access_token) {
          await supabase.auth.setSession({
            access_token: params.access_token as string,
            refresh_token: params.refresh_token as string,
          })
        }
      }
    }
    return data
  },

  // Login ด้วย Apple (deep link กลับมาที่แอป)
  loginWithApple: async () => {
    const WebBrowser = await import('expo-web-browser')
    const redirectTo = Linking.createURL('/auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    })
    if (error) throw error
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'success' && result.url) {
        const { params } = Linking.parse(result.url)
        if (params?.access_token) {
          await supabase.auth.setSession({
            access_token: params.access_token as string,
            refresh_token: params.refresh_token as string,
          })
        }
      }
    }
    return data
  },

  // Logout
  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // ดึง Session ปัจจุบัน
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },
}