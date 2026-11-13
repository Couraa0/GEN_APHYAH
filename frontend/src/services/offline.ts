// Penyimpanan lokal (IndexedDB): cache respons GET terakhir dan antrean transaksi offline.
// Data di sini hanya ada di perangkat ini sampai tersinkron ke server.

export interface QueueItem {
  /** UUID buatan klien; dikirim sebagai Idempotency-Key agar kirim ulang tidak menggandakan. */
  id: string
  path: string
  body: Record<string, unknown>
  createdAt: number
  /** Terisi bila server menolak transaksi (validasi/konflik) dan perlu ditinjau petugas. */
  error?: string
}

let dbPromise: Promise<IDBDatabase> | undefined

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const open = indexedDB.open('runa', 1)
    open.onupgradeneeded = () => {
      open.result.createObjectStore('cache')
      open.result.createObjectStore('queue', { keyPath: 'id' })
    }
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => reject(open.error)
  })
  return dbPromise
}

async function run<T>(
  store: 'cache' | 'queue',
  mode: IDBTransactionMode,
  op: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const tx = (await db()).transaction(store, mode)
  const request = op(tx.objectStore(store))
  return new Promise((resolve, reject) => {
    // Tunggu transaksi selesai, bukan hanya request, agar data benar-benar tersimpan.
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = tx.onabort = () => reject(tx.error ?? request.error)
  })
}

export const QUEUE_EVENT = 'runa:queue'
const changed = () => window.dispatchEvent(new Event(QUEUE_EVENT))

export const cache = {
  get: (path: string) =>
    run<{ data: unknown; at: number } | undefined>('cache', 'readonly', (s) => s.get(path)),
  put: (path: string, data: unknown) =>
    run('cache', 'readwrite', (s) => s.put({ data, at: Date.now() }, path)),
  clear: () => run('cache', 'readwrite', (s) => s.clear()),
}

export const queue = {
  async all(): Promise<QueueItem[]> {
    const items = await run<QueueItem[]>('queue', 'readonly', (s) => s.getAll())
    return items.sort((a, b) => a.createdAt - b.createdAt)
  },
  /** Tambah transaksi baru; id acaknya menjadi Idempotency-Key saat dikirim. */
  add(path: string, body: Record<string, unknown>) {
    return this.put({ id: crypto.randomUUID(), path, body, createdAt: Date.now() })
  },
  async put(item: QueueItem) {
    await run('queue', 'readwrite', (s) => s.put(item))
    changed()
  },
  async remove(id: string) {
    await run('queue', 'readwrite', (s) => s.delete(id))
    changed()
  },
}
