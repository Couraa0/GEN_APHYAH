import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

interface State<T> {
  data?: T
  error?: string
  /** Waktu data di-cache bila sedang menampilkan data offline. */
  cachedAt?: number | null
}

/**
 * Muat data GET dari API. `path` null = tidak memuat (mis. role tidak berhak).
 * Ubah nilai `refresh` untuk memaksa muat ulang dari luar.
 */
export function useApi<T>(path: string | null, refresh = 0) {
  const [state, setState] = useState<State<T>>({})

  const reload = useCallback(() => {
    if (!path) return
    api.get<T>(path).then(
      ({ data, cachedAt }) => setState({ data, cachedAt }),
      (err: Error) => setState((prev) => ({ ...prev, error: err.message })),
    )
  }, [path])

  useEffect(reload, [reload, refresh])

  return { ...state, reload }
}

/** Pilihan <select> dari endpoint daftar (id + name), hanya yang aktif. */
export function useOptions(path: string | null, refresh = 0) {
  const { data } = useApi<{ id: string; name: string; active?: boolean }[]>(path, refresh)
  return (data ?? [])
    .filter((item) => item.active !== false)
    .map((item) => ({ value: item.id, label: item.name }))
}
