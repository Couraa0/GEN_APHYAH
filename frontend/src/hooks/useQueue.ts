import { useEffect, useState } from 'react'
import { queue, QUEUE_EVENT } from '../services/offline'
import type { QueueItem } from '../services/offline'

/** Isi antrean transaksi offline di perangkat ini; ikut berubah saat antrean berubah. */
export function useQueue(): QueueItem[] {
  const [items, setItems] = useState<QueueItem[]>([])

  useEffect(() => {
    const load = () => void queue.all().then(setItems)
    load()
    window.addEventListener(QUEUE_EVENT, load)
    return () => window.removeEventListener(QUEUE_EVENT, load)
  }, [])

  return items
}
