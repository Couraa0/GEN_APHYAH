import { useState } from 'react'
import { Link } from 'react-router'
import { TriangleAlert } from 'lucide-react'
import { Card, StaleNote, Table } from '../../components/Resource'
import { useApi } from '../../hooks/useApi'
import { useQueue } from '../../hooks/useQueue'
import type { Dashboard } from '../../types'
import { dateTime, kg, label, rupiah, toLocalInput } from '../../utils/format'

const todayFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' })

/** 14 hari terakhir; hari tanpa pengumpulan tetap tampil sebagai batang kosong. */
function Trend({ trend }: { trend: Dashboard['trend'] }) {
  const [now] = useState(() => Date.now())
  const byDay = new Map(trend.map((t) => [t.day, t.weightKg]))
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = toLocalInput(new Date(now - (13 - i) * 86_400_000)).slice(0, 10)
    return { day, weightKg: byDay.get(day) ?? 0 }
  })
  const max = Math.max(...days.map((d) => d.weightKg), 1)
  return (
    <div className="bars" role="img" aria-label="Grafik berat pengumpulan harian 14 hari terakhir">
      {days.map((d) => (
        <div key={d.day} title={`${d.day}: ${kg(d.weightKg)}`}>
          <div className="bar" style={{ height: `${(d.weightKg / max) * 100}%` }} />
          {d.day.slice(8)}
        </div>
      ))}
    </div>
  )
}

/** Ke mana material yang terkumpul pergi: tersalurkan, diolah, atau masih di stok. */
function MaterialFlow({ data }: { data: Dashboard }) {
  const collected = Number(data.collected.totalKg)
  const parts = [
    { name: 'Tersalurkan', value: Number(data.sold.totalKg), color: 'var(--kunyit)' },
    { name: 'Diolah', value: Number(data.plastic.processedKg), color: '#7cc4dc' },
    {
      name: 'Masih di stok',
      value: data.stock.reduce((total, c) => total + Number(c.stockKg ?? 0), 0),
      color: '#8fd19a',
    },
  ]
  const total = Math.max(collected, parts.reduce((sum, p) => sum + p.value, 0))

  return (
    <section className="alur" aria-labelledby="alur-judul">
      <h2 id="alur-judul">Perjalanan material</h2>
      <div className="alur-total">
        {kg(collected)} <small>terkumpul dari {data.collected.count} pencatatan</small>
      </div>
      {total > 0 ? (
        <>
          <div className="alur-batang" aria-hidden="true">
            {parts.map((p) => (
              <div key={p.name} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
            ))}
          </div>
          <ul className="alur-legenda">
            {parts.map((p) => (
              <li key={p.name}>
                <i style={{ background: p.color }} />
                <span>{p.name}</span>
                <strong>{kg(p.value)}</strong>
              </li>
            ))}
            <li>
              <i style={{ background: 'transparent' }} />
              <span>Nilai transaksi</span>
              <strong>{rupiah(data.sold.totalAmount)}</strong>
            </li>
          </ul>
        </>
      ) : (
        <p className="mb-0 mt-2">
          Belum ada pengumpulan.{' '}
          <Link to="/pengumpulan" className="link-light fw-semibold">
            Catat pengumpulan pertama
          </Link>
        </p>
      )}
    </section>
  )
}

export function DashboardPage() {
  const { data, error, cachedAt } = useApi<Dashboard>('/dashboard')
  const queued = useQueue()
  const [today] = useState(() => todayFormat.format(new Date()))

  if (!data) return error ? <StaleNote error={error} /> : <p className="text-secondary">Memuat…</p>

  const notices = [
    queued.length > 0 && {
      to: '/pengumpulan',
      text: `${queued.length} transaksi di perangkat ini belum tersinkron`,
    },
    data.pending.weighings > 0 && {
      to: '/pengumpulan',
      text: `${data.pending.weighings} hasil timbangan menunggu diverifikasi`,
    },
    data.pending.requests > 0 && {
      to: '/marketplace',
      text: `${data.pending.requests} permintaan material menunggu keputusan`,
    },
  ].filter((n) => !!n)

  const maxPoint = Math.max(...data.collected.byPoint.map((p) => Number(p.weightKg)), 1)
  const maxStock = Math.max(...data.stock.map((c) => Number(c.stockKg ?? 0)), 1)

  return (
    <>
      <h1 className="mb-0">Beranda</h1>
      <p className="text-secondary">{today}</p>
      <StaleNote at={cachedAt} />

      <MaterialFlow data={data} />

      {notices.length > 0 && (
        <ul className="tindak mb-3" aria-label="Perlu ditindaklanjuti">
          {notices.map((n) => (
            <li key={n.text}>
              <Link to={n.to}>
                <TriangleAlert size={18} aria-hidden />
                {n.text}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="titik-grid">
        {data.collected.byPoint.map((p) => (
          <div className="titik" key={p.id}>
            <div className="titik-nama">{p.name}</div>
            <div className="titik-berat">{kg(p.weightKg)}</div>
            <div className="small text-secondary mb-2">{p.count} pencatatan</div>
            <div className="meter" aria-hidden="true">
              <div style={{ width: `${(Number(p.weightKg) / maxPoint) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <Card title="Pengumpulan 14 hari terakhir">
            <Trend trend={data.trend} />
          </Card>
        </div>
        <div className="col-12 col-xl-5">
          <Card title="Stok material">
            <ul className="batang-list">
              {data.stock.map((c) => (
                <li key={c.id}>
                  <span>
                    <i className={`dot ${c.group}`} title={label(c.group)} />
                    {c.name}
                  </span>
                  <strong>{kg(c.stockKg)}</strong>
                  <div className="meter" aria-hidden="true">
                    <div style={{ width: `${(Number(c.stockKg ?? 0) / maxStock) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="col-12 col-xl-7">
          <Card title="Pengangkutan berikutnya">
            <Table
              rows={data.upcomingPickups}
              empty="Tidak ada pengangkutan terjadwal."
              columns={[
                { label: 'Jadwal', render: (p) => dateTime(p.scheduledAt) },
                { label: 'Titik', render: (p) => p.collectionPoint.name },
                { label: 'Petugas', render: (p) => p.assignedTo?.name ?? '-' },
                { label: 'Status', render: (p) => label(p.status) },
              ]}
            />
          </Card>
        </div>
        <div className="col-12 col-xl-5">
          <Card title="Pilot pengolahan">
            <dl className="rincian-data">
              <dt>Organik diproses (BSF)</dt>
              <dd>{kg(data.organic.feedingKg)}</dd>
              <dt>Panen larva</dt>
              <dd>{kg(data.organic.harvestKg)}</dd>
              <dt>Residu / frass</dt>
              <dd>{kg(data.organic.frassKg)}</dd>
              <dt>Plastik diolah</dt>
              <dd>{kg(data.plastic.processedKg)}</dd>
              <dt>Prototipe paving block</dt>
              <dd>{data.plastic.prototypes}</dd>
              <dt>Dipindahkan lewat pengangkutan</dt>
              <dd>{kg(data.moved.totalKg)}</dd>
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
