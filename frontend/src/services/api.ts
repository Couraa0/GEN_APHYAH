import type { User } from '../types'
import { cache, queue } from './offline'

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ---- Sesi -------------------------------------------------------------------
// ponytail: token disimpan di localStorage (frontend & backend beda domain di Vercel,
// cookie lintas-situs tidak andal). Pindah ke cookie httpOnly bila keduanya satu domain.
export const LOGOUT_EVENT = 'runa:logout'

export const session = {
  get token() {
    return localStorage.getItem('runa.token')
  },
  get user(): User | null {
    const raw = localStorage.getItem('runa.user')
    return raw ? (JSON.parse(raw) as User) : null
  },
  set(token: string, user: User) {
    localStorage.setItem('runa.token', token)
    localStorage.setItem('runa.user', JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem('runa.token')
    localStorage.removeItem('runa.user')
    void cache.clear() // data cache milik pengguna sebelumnya tidak boleh terbawa
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  },
}

// ---- Request ----------------------------------------------------------------
function errorMessage(body: unknown, fallback: string): string {
  // Bentuk dari backend: { message: string | { message: string | string[] } }
  const outer = (body as { message?: unknown } | null)?.message
  const inner = typeof outer === 'object' && outer ? (outer as { message?: unknown }).message : outer
  if (Array.isArray(inner)) return inner.join(', ')
  return typeof inner === 'string' ? inner : fallback
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const token = session.token
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) session.clear()
    throw new ApiError(res.status, errorMessage(data, `Gagal (${res.status})`))
  }
  return data as T
}

export interface Loaded<T> {
  data: T
  /** Terisi bila data berasal dari cache karena server tidak terjangkau. */
  cachedAt: number | null
}

export const api = {
  /** GET dengan cadangan cache: saat offline mengembalikan data terakhir beserta waktunya. */
  async get<T>(path: string): Promise<Loaded<T>> {
    try {
      const data = await request<T>('GET', path)
      void cache.put(path, data)
      return { data, cachedAt: null }
    } catch (err) {
      // 4xx = server menjawab dan menolak: tampilkan apa adanya. Jaringan putus atau
      // server/gateway error (5xx): pakai data terakhir yang tersimpan.
      if (err instanceof ApiError && err.status < 500) throw err
      const hit = await cache.get(path)
      if (!hit) {
        throw err instanceof ApiError
          ? err
          : new Error('Tidak ada koneksi dan belum ada data tersimpan', { cause: err })
      }
      return { data: hit.data as T, cachedAt: hit.at }
    }
  },
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),

  async login(username: string, password: string) {
    const res = await request<{ accessToken: string; user: User }>('POST', '/auth/login', {
      username,
      password,
    })
    session.set(res.accessToken, res.user)
    return res.user
  },
}

// ---- Sinkronisasi antrean offline ---------------------------------------------
let syncing: Promise<void> | undefined

/**
 * Kirim transaksi yang antre ke server, berurutan. Aman dipanggil kapan saja dan
 * berulang: tiap item membawa Idempotency-Key sehingga tidak pernah tercatat ganda.
 */
export function syncQueue(): Promise<void> {
  syncing ??= (async () => {
    for (const item of await queue.all()) {
      if (item.error) continue // sudah ditolak server: menunggu ditinjau petugas
      try {
        await api.post(item.path, item.body, { 'Idempotency-Key': item.id })
        await queue.remove(item.id)
      } catch (err) {
        // 4xx (selain sesi habis / terlalu sering) = ditolak permanen: tandai gagal.
        // Selain itu (jaringan putus, server error): berhenti, coba lagi nanti.
        const rejected =
          err instanceof ApiError &&
          err.status >= 400 &&
          err.status < 500 &&
          ![401, 408, 429].includes(err.status)
        if (!rejected) break
        await queue.put({ ...item, error: (err as Error).message })
      }
    }
  })().finally(() => {
    syncing = undefined
  })
  return syncing
}
