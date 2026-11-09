import type { BackendStatus } from '../types'

const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) || ''
const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

export async function fetchBackendStatus(): Promise<BackendStatus> {
  let res: Response
  try {
    const url = API_BASE_URL ? `${API_BASE_URL}/api/status` : '/api/status'
    res = await fetch(url)
  } catch (error) {
    // Fallback khusus bila dijalankan lokal tanpa proxy aktif
    if (!API_BASE_URL) {
      res = await fetch('http://localhost:3000/api/status')
    } else {
      throw error
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
