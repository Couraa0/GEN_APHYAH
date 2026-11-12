import { useState } from 'react'
import { Link } from 'react-router'
import { Card, StaleNote, Table } from '../../components/Resource'
import { useApi } from '../../hooks/useApi'
import { useQueue } from '../../hooks/useQueue'
import type { Dashboard } from '../../types'
import { dateTime, kg, label, rupiah, toLocalInput } from '../../utils/format'

function Stat({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="col-6 col-lg-4 col-xl-2">
      <div className="stat">
        <div className="value">{value}</div>
        <div className="caption">{caption}</div>
      </div>
    </div>
  )
}

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

export function DashboardPage() {
  const { data, error, cachedAt } = useApi<Dashboard>('/dashboard')
  const queued = useQueue()

  if (!data) return error ? <StaleNote error={error} /> : <p className="text-secondary">Memuat…</p>

  const groupKg = (group: string) =>
    data.collected.byCategory
      .filter((c) => c.group === group)
      .reduce((total, c) => total + Number(c.weightKg), 0)

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

  return (
    <>
      <h1 className="h4 mb-3">Beranda</h1>
      <StaleNote at={cachedAt} />

      <div className="row g-2 mb-3">
        <Stat value={kg(data.collected.totalKg)} caption="Total terkumpul" />
        <Stat value={kg(groupKg('ANORGANIK'))} caption="Anorganik" />
        <Stat value={kg(groupKg('ORGANIK'))} caption="Organik" />
        <Stat value={kg(data.moved.totalKg)} caption="Dipindahkan" />
        <Stat value={kg(data.sold.totalKg)} caption="Terjual / tersalurkan" />
        <Stat value={rupiah(data.sold.totalAmount)} caption="Nilai transaksi" />
      </div>

      {notices.length > 0 && (
        <Card title="Perlu ditindaklanjuti">
          <ul className="mb-0">
            {notices.map((n) => (
              <li key={n.text}>
                <Link to={n.to}>{n.text}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <Card title="Tren pengumpulan (14 hari)">
            <Trend trend={data.trend} />
          </Card>
        </div>
        <div className="col-12 col-xl-6">
          <Card title="Aktivitas titik pengumpulan">
            <Table
              rows={data.collected.byPoint}
              columns={[
                { label: 'Titik', render: (p) => p.name },
                { label: 'Transaksi', align: 'end', render: (p) => p.count },
                { label: 'Berat', align: 'end', render: (p) => kg(p.weightKg) },
              ]}
            />
          </Card>
        </div>
        <div className="col-12 col-xl-6">
          <Card title="Stok material">
            <Table
              rows={data.stock}
              columns={[
                { label: 'Material', render: (c) => c.name },
                { label: 'Kelompok', render: (c) => label(c.group) },
                { label: 'Stok', align: 'end', render: (c) => kg(c.stockKg) },
              ]}
            />
          </Card>
        </div>
        <div className="col-12 col-xl-6">
          <Card title="Jadwal pengangkutan berikutnya">
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
        <div className="col-12">
          <Card title="Pilot pengolahan">
            <div className="row g-2">
              <Stat value={kg(data.organic.feedingKg)} caption="Organik diproses (BSF)" />
              <Stat value={kg(data.organic.harvestKg)} caption="Panen larva" />
              <Stat value={kg(data.organic.frassKg)} caption="Residu / frass" />
              <Stat value={kg(data.plastic.processedKg)} caption="Plastik diolah" />
              <Stat value={String(data.plastic.experiments)} caption="Eksperimen paving block" />
              <Stat value={String(data.plastic.prototypes)} caption="Prototipe" />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
