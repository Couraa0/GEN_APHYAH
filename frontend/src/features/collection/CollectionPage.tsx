import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Card, StaleNote, Table } from '../../components/Resource'
import { useApi, useOptions } from '../../hooks/useApi'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useQueue } from '../../hooks/useQueue'
import { api, syncQueue } from '../../services/api'
import { queue } from '../../services/offline'
import type { Category, Collection, Weighing } from '../../types'
import { dateTime, kg, label, options, toLocalInput } from '../../utils/format'

const POINT_KEY = 'runa.point'

interface ChoiceOption {
  value: string
  label: ReactNode
}

/** Pilihan sekali ketuk: grup radio asli yang ditata sebagai tombol besar. */
function Choice({
  name,
  legend,
  items,
  value,
  onChange,
}: {
  name: string
  legend: string
  items: ChoiceOption[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="pilihan">
      <legend>{legend}</legend>
      <div className="pilihan-grid">
        {items.map((item) => (
          <label key={item.value}>
            <input
              type="radio"
              name={name}
              required
              checked={value === item.value}
              onChange={() => onChange(item.value)}
            />
            {item.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function CollectionPage() {
  const isOnline = useNetworkStatus()
  const queued = useQueue()
  const points = useOptions('/collection-points')
  const categories = (useApi<Category[]>('/categories').data ?? []).filter((c) => c.active !== false)
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
  const [saved, setSaved] = useState<string | null>(null)

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

  const pointName = (id: unknown) => points.find((p) => p.value === id)?.label ?? '-'
  const categoryName = (id: unknown) => categories.find((c) => c.id === id)?.name ?? '-'

  async function submit(event: FormEvent) {
    event.preventDefault()
    const weightKg = Number(weighing ? weighing.weightKg : weight)
    localStorage.setItem(POINT_KEY, pointId)
    // Selalu simpan ke perangkat dulu, baru kirim: data aman walau koneksi putus di tengah jalan.
    await queue.add('/collections', {
      collectionPointId: pointId,
      wasteCategoryId: categoryId,
      ...(householdId && { householdId }),
      collectionType,
      weightKg,
      recordedAt: new Date(recordedAt).toISOString(),
      ...(weighing && { weighingRecordId: weighing.id }),
    })
    setSaved(`${kg(weightKg)} ${categoryName(categoryId)} di ${pointName(pointId)}`)
    setWeight('')
    setWeighing(null)
    setRecordedAt(toLocalInput())
    void syncQueue()
  }

  async function discard(w: Weighing) {
    if (!confirm(`Buang hasil timbangan ${kg(w.weightKg)}?`)) return
    await api.patch(`/weighing/${w.id}/discard`, {}).catch((err: Error) => alert(err.message))
    weighings.reload()
  }

  return (
    <>
      <h1 className="mb-3">Catat pengumpulan</h1>

      <form className="panel d-grid gap-3" onSubmit={submit}>
        <div className="timbangan">
          <label htmlFor="weight">Berat (kg)</label>
          <div className="timbangan-layar">
            {weighing ? (
              <input id="weight" readOnly value={String(Number(weighing.weightKg))} />
            ) : (
              <input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0.001"
                required
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            )}
            <span>kg</span>
          </div>
          <div className="timbangan-sumber">
            {weighing ? (
              <>
                Dari timbangan {weighing.deviceId}
                <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setWeighing(null)}>
                  Ketik manual
                </button>
              </>
            ) : (
              'Ketik berat, atau pakai hasil timbangan digital di bawah'
            )}
          </div>
        </div>

        <Choice name="point" legend="Titik pengumpulan" items={points} value={pointId} onChange={setPointId} />
        <Choice
          name="category"
          legend="Kategori sampah"
          value={categoryId}
          onChange={setCategoryId}
          items={categories.map((c) => ({
            value: c.id,
            label: (
              <>
                <i className={`dot ${c.group}`} />
                {c.name}
              </>
            ),
          }))}
        />

        <details className="rincian">
          <summary>Rincian lain: rumah tangga, cara, dan waktu</summary>
          <div className="row g-2 pt-2">
            <div className="col-12 col-md-4">
              <label className="form-label mb-1 small fw-semibold" htmlFor="household">
                Rumah tangga
              </label>
              <select id="household" className="form-select" value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
                <option value="">Gabungan / tidak diketahui</option>
                {households.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4">
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
            <div className="col-12 col-md-4">
              <label className="form-label mb-1 small fw-semibold" htmlFor="recordedAt">
                Waktu
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
          </div>
        </details>

        <button className="btn btn-success btn-lg">Simpan pengumpulan</button>
        {saved && (
          <div className="alert alert-success py-2 mb-0" role="status">
            Tersimpan: {saved}.{!isOnline && ' Dikirim ke server saat online.'}
          </div>
        )}
      </form>

      {(weighings.data?.length ?? 0) > 0 && (
        <Card title="Hasil timbangan digital menunggu verifikasi">
          <Table
            rows={weighings.data}
            columns={[
              { label: 'Waktu ukur', render: (w) => dateTime(w.measuredAt) },
              { label: 'Perangkat', render: (w) => w.deviceId },
              { label: 'Berat', align: 'end', render: (w) => <strong>{kg(w.weightKg)}</strong> },
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
              { label: 'Titik', render: (q) => pointName(q.body.collectionPointId) },
              { label: 'Kategori', render: (q) => categoryName(q.body.wasteCategoryId) },
              { label: 'Berat', align: 'end', render: (q) => kg(q.body.weightKg as number) },
              {
                label: 'Status',
                render: (q) =>
                  q.error ? (
                    <span className="text-danger">Ditolak: {q.error}</span>
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
          empty="Belum ada pengumpulan tercatat."
          columns={[
            { label: 'Waktu', render: (c) => dateTime(c.recordedAt) },
            { label: 'Titik', render: (c) => c.collectionPoint.name },
            { label: 'Kategori', render: (c) => c.wasteCategory.name },
            { label: 'Berat', align: 'end', render: (c) => <strong>{kg(c.weightKg)}</strong> },
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
