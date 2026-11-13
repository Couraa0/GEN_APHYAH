import { useState } from 'react'
import { Card, StaleNote, Table } from '../../components/Resource'
import { useApi } from '../../hooks/useApi'
import type { Report } from '../../types'
import { kg, label, rupiah } from '../../utils/format'

function Row({ name, value }: { name: string; value: string | number }) {
  return (
    <tr>
      <td>{name}</td>
      <td className="text-end fw-semibold">{value}</td>
    </tr>
  )
}

export function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Tanggal dipilih dalam waktu perangkat; dikirim sebagai awal & akhir hari dalam UTC.
  const query = new URLSearchParams()
  if (from) query.set('from', new Date(`${from}T00:00:00`).toISOString())
  if (to) query.set('to', new Date(`${to}T23:59:59.999`).toISOString())
  const { data, error, cachedAt } = useApi<Report>(`/reports?${query}`)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Laporan & Dampak</h1>
        <button className="btn btn-sm btn-outline-success no-print" onClick={() => window.print()}>
          Cetak / simpan PDF
        </button>
      </div>

      <div className="row g-2 mb-3 no-print">
        <div className="col-6 col-md-3">
          <label className="form-label mb-1 small fw-semibold" htmlFor="from">
            Dari tanggal
          </label>
          <input id="from" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label mb-1 small fw-semibold" htmlFor="to">
            Sampai tanggal
          </label>
          <input id="to" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <p className="text-secondary">
        Periode: {from || 'awal'} s.d. {to || 'sekarang'}
      </p>
      <StaleNote at={cachedAt} error={error} />

      {data && (
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <Card title="Ringkasan">
              <table className="table table-sm mb-0">
                <tbody>
                  <Row name="Sampah terkumpul" value={kg(data.collected.totalKg)} />
                  <Row name="Jumlah transaksi pengumpulan" value={data.collected.count} />
                  <Row name="Material dipindahkan (pengangkutan selesai)" value={kg(data.moved.totalKg)} />
                  <Row name="Material terjual / tersalurkan" value={kg(data.sold.totalKg)} />
                  <Row name="Jumlah transaksi penjualan" value={data.sold.count} />
                  <Row name="Nilai transaksi (pendapatan RUNA)" value={rupiah(data.sold.totalAmount)} />
                </tbody>
              </table>
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card title="Pilot pengolahan">
              <table className="table table-sm mb-0">
                <tbody>
                  <Row name="Bahan organik diproses (BSF)" value={kg(data.organic.feedingKg)} />
                  <Row name="Hasil panen larva" value={kg(data.organic.harvestKg)} />
                  <Row name="Residu / frass" value={kg(data.organic.frassKg)} />
                  <Row name="Plastik diolah" value={kg(data.plastic.processedKg)} />
                  <Row name="Eksperimen paving block" value={data.plastic.experiments} />
                  <Row name="Prototipe dihasilkan" value={data.plastic.prototypes} />
                </tbody>
              </table>
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card title="Terkumpul per kategori">
              <Table
                rows={data.collected.byCategory}
                empty="Tidak ada pengumpulan pada periode ini."
                columns={[
                  { label: 'Kategori', render: (c) => c.name },
                  { label: 'Kelompok', render: (c) => (c.group ? label(c.group) : '-') },
                  { label: 'Berat', align: 'end', render: (c) => kg(c.weightKg) },
                ]}
              />
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card title="Terkumpul per titik">
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
        </div>
      )}
    </>
  )
}
