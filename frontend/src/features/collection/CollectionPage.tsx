import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Card, StaleNote, Table } from '../../components/Resource'
import { useApi, useOptions } from '../../hooks/useApi'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useQueue } from '../../hooks/useQueue'
import { api, syncQueue } from '../../services/api'
import { queue } from '../../services/offline'
import type { Collection, Weighing } from '../../types'
import { dateTime, kg, label, options, toLocalInput } from '../../utils/format'

const POINT_KEY = 'runa.point'

export function CollectionPage() {
  const isOnline = useNetworkStatus()
  const queued = useQueue()
  const points = useOptions('/collection-points')
  const categories = useOptions('/categories')
  const households = useOptions('/households')
  const weighings = useApi<Weighing[]>('/weighing')
  const history = useApi<Collection[]>('/collections')

  // Titik terakhir diingat: petugas biasanya mencatat banyak transaksi di titik yang sama.
  const [pointId, setPointId] = useState(() => localStorage.getItem(POINT_KEY) ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [householdId, setHouseholdId] = useState('')
  const [collectionType, setCollectionType] = useState('POINT_COLLECTION')
  const [weight, setWeight] = useState('')
  const [weighing, setWeighing] = useState<Weighing | null>(null)
  const [recordedAt, setRecordedAt] = useState(() => toLocalInput())
  const [saved, setSaved] = useState(false)

  // Antrean berkurang = ada yang baru tersinkron: muat ulang riwayat dari server.
  const reloadHistory = history.reload
  const reloadWeighings = weighings.reload
  const previousQueued = useRef(queued.length)
  useEffect(() => {
    if (queued.length < previousQueued.current) {
      reloadHistory()
      reloadWeighings()
    }
    previousQueued.current = queued.length
  }, [queued.length, reloadHistory, reloadWeighings])

  async function submit(event: FormEvent) {
    event.preventDefault()
    localStorage.setItem(POINT_KEY, pointId)
    // Selalu simpan ke perangkat dulu, baru kirim: data aman walau koneksi putus di tengah jalan.
    await queue.put({
      id: crypto.randomUUID(),
      path: '/collections',
      createdAt: Date.now(),
      body: {
        collectionPointId: pointId,
        wasteCategoryId: categoryId,
        ...(householdId && { householdId }),
        collectionType,
        weightKg: Number(weighing ? weighing.weightKg : weight),
        recordedAt: new Date(recordedAt).toISOString(),
        ...(weighing && { weighingRecordId: weighing.id }),
      },
    })
    setWeight('')
    setWeighing(null)
    setRecordedAt(toLocalInput())
    setSaved(true)
    void syncQueue()
  }

  async function discard(w: Weighing) {
    if (!confirm(`Buang hasil timbangan ${kg(w.weightKg)}?`)) return
    await api.patch(`/weighing/${w.id}/discard`, {}).catch((err: Error) => alert(err.message))
    weighings.reload()
  }

  const name = (list: { value: string; label: string }[], id: unknown) =>
    list.find((o) => o.value === id)?.label ?? '-'

  return (
    <>
      <h1 className="h4 mb-3">Pengumpulan Sampah</h1>

      <Card title="Catat pengumpulan">
        <form className="row g-2 align-items-end" onSubmit={submit}>
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label mb-1 small fw-semibold" htmlFor="point">
              Titik pengumpulan <span className="text-danger">*</span>
            </label>
            <select id="point" className="form-select" required value={pointId} onChange={(e) => setPointId(e.target.value)}>
              <option value="">Pilih…</option>
              {points.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label mb-1 small fw-semibold" htmlFor="category">
              Kategori sampah <span className="text-danger">*</span>
            </label>
            <select id="category" className="form-select" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Pilih…</option>
              {categories.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label mb-1 small fw-semibold" htmlFor="weight">
              Berat (kg) <span className="text-danger">*</span>
            </label>
            {weighing ? (
              <div className="input-group">
                <input id="weight" className="form-control" readOnly value={`${kg(weighing.weightKg)} — dari timbangan`} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setWeighing(null)}>
                  Batal
                </button>
              </div>
            ) : (
              <input
                id="weight"
                className="form-control"
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0.001"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            )}
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label mb-1 small fw-semibold" htmlFor="household">
              Rumah tangga
            </label>
            <select id="household" className="form-select" value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
              <option value="">(gabungan / tidak diketahui)</option>
              {households.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label mb-1 small fw-semibold" htmlFor="type">
              Cara pengumpulan
            </label>
            <select id="type" className="form-select" value={collectionType} onChange={(e) => setCollectionType(e.target.value)}>
              {options('POINT_COLLECTION', 'HOME_PICKUP', 'DROP_OFF').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label mb-1 small fw-semibold" htmlFor="recordedAt">
              Waktu <span className="text-danger">*</span>
            </label>
            <input
              id="recordedAt"
              className="form-control"
              type="datetime-local"
              required
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
          </div>
          <div className="col-12 d-flex align-items-center gap-3">
            <button className="btn btn-success">Simpan</button>
            {saved && (
              <span className="text-success small" role="status">
                {isOnline ? 'Tersimpan.' : 'Tersimpan di perangkat, dikirim saat online.'}
              </span>
            )}
          </div>
        </form>
      </Card>

      {(weighings.data?.length ?? 0) > 0 && (
        <Card title="Hasil timbangan digital menunggu verifikasi">
          <Table
            rows={weighings.data}
            columns={[
              { label: 'Waktu ukur', render: (w) => dateTime(w.measuredAt) },
              { label: 'Perangkat', render: (w) => w.deviceId },
              { label: 'Berat', align: 'end', render: (w) => kg(w.weightKg) },
              {
                label: '',
                align: 'end',
                render: (w) => (
                  <span className="d-inline-flex gap-1">
                    <button className="btn btn-sm btn-success" onClick={() => setWeighing(w)}>
                      Pakai
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => void discard(w)}>
                      Buang
                    </button>
                  </span>
                ),
              },
            ]}
          />
        </Card>
      )}

      {queued.length > 0 && (
        <Card
          title={`Belum tersinkron (${queued.length})`}
          actions={
            <button className="btn btn-sm btn-outline-success" onClick={() => void syncQueue()}>
              Sinkronkan sekarang
            </button>
          }
        >
          <Table
            rows={queued}
            columns={[
              { label: 'Dicatat', render: (q) => dateTime(q.createdAt) },
              { label: 'Titik', render: (q) => name(points, q.body.collectionPointId) },
              { label: 'Kategori', render: (q) => name(categories, q.body.wasteCategoryId) },
              { label: 'Berat', align: 'end', render: (q) => kg(q.body.weightKg as number) },
              {
                label: 'Status',
                render: (q) =>
                  q.error ? (
                    <span className="text-danger">Gagal: {q.error}</span>
                  ) : (
                    <span className="text-secondary">Menunggu koneksi</span>
                  ),
              },
              {
                label: '',
                align: 'end',
                render: (q) =>
                  q.error && (
                    <span className="d-inline-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => void queue.put({ ...q, error: undefined }).then(syncQueue)}
                      >
                        Coba lagi
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => confirm('Hapus transaksi ini dari perangkat?') && void queue.remove(q.id)}
                      >
                        Hapus
                      </button>
                    </span>
                  ),
              },
            ]}
          />
        </Card>
      )}

      <Card title="Riwayat pengumpulan">
        <StaleNote at={history.cachedAt} error={history.error} />
        <Table
          rows={history.data}
          columns={[
            { label: 'Waktu', render: (c) => dateTime(c.recordedAt) },
            { label: 'Titik', render: (c) => c.collectionPoint.name },
            { label: 'Kategori', render: (c) => c.wasteCategory.name },
            { label: 'Berat', align: 'end', render: (c) => kg(c.weightKg) },
            { label: 'Rumah tangga', render: (c) => c.household?.name ?? '-' },
            { label: 'Cara', render: (c) => label(c.collectionType) },
            { label: 'Sumber berat', render: (c) => (c.weighing ? `Timbangan ${c.weighing.deviceId}` : 'Manual') },
            { label: 'Petugas', render: (c) => c.recordedBy.name },
          ]}
        />
      </Card>
    </>
  )
}
