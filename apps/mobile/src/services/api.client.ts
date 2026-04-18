import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function request(method: string, path: string, body?: any) {
  const token = await getToken()
  if (!token) {
    throw new Error('Not authenticated')
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()

  if (!res.ok) {
    let message = text
    try { message = JSON.parse(text)?.message ?? text } catch {}
    throw new Error(`${res.status}: ${message}`)
  }

  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from ${method} ${path}: ${text.slice(0, 100)}`)
  }
}

/** raw variant — คืน { ok, status, data } โดยไม่ throw เพื่อให้ caller ตรวจ status ได้ (เช่น 409) */
async function requestRaw(method: string, path: string, body?: any) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data: any = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  return { ok: res.ok, status: res.status, data }
}

export const api = {
  get:     (path: string) => request('GET', path),
  post:    (path: string, body: any) => request('POST', path, body),
  put:     (path: string, body: any) => request('PUT', path, body),
  delete:  (path: string) => request('DELETE', path),
  postRaw: (path: string, body: any) => requestRaw('POST', path, body),
}
