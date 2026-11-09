import type { BackendStatus } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export async function fetchBackendStatus(): Promise<BackendStatus> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/status`)
  } catch {
    res = await fetch('http://localhost:3000/api/status')
  }

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

