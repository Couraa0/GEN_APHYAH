import { useState } from 'react'
import { Card, Form, Resource, StaleNote, Table } from '../../components/Resource'
import type { Field } from '../../components/Resource'
import { useApi, useOptions } from '../../hooks/useApi'
import { api } from '../../services/api'
import type { Buyer, Category, MarketRequest, Sale, User } from '../../types'
import { dateTime, kg, label, rupiah } from '../../utils/format'

const saleFields: Field[] = [
  { name: 'weightKg', label: 'Berat diserahkan (kg)', type: 'number', required: true, min: '0.001' },
  { name: 'pricePerKg', label: 'Harga per kg (Rp)', type: 'number', step: '1', min: '0', required: true },
  { name: 'soldAt', label: 'Waktu serah terima', type: 'datetime-local', required: true },
]

export function MarketplacePage({ user }: { user: User }) {
  const isMitra = user.role === 'MITRA'
  const canManage = user.role === 'ADMIN' || user.role === 'PENGURUS'
  const [refresh, setRefresh] = useState(0)
  const changed = () => setRefresh((n) => n + 1)
  const [completing, setCompleting] = useState<MarketRequest | null>(null)

  const listings = useApi<Category[]>('/marketplace/listings', refresh)
  const listed = (listings.data ?? []).map((c) => ({ value: c.id, label: c.name }))
  const buyers = useOptions(isMitra ? null : '/buyers', refresh)

  async function decide(request: MarketRequest, status: 'APPROVED' | 'REJECTED') {
    await api
      .patch(`/marketplace/requests/${request.id}`, { status })
      .catch((err: Error) => alert(err.message))
    changed()
  }

  return (
    <>
      <h1 className="h4 mb-3">Circular Marketplace</h1>

      <Card title="Katalog material">
        <StaleNote at={listings.cachedAt} error={listings.error} />
        <Table
          rows={listings.data}
          empty="Belum ada material di katalog. Tandai kategori sebagai “tampil di katalog” di Data Master."
          columns={[
            { label: 'Material', render: (c) => c.name },
            { label: 'Stok tersedia', align: 'end', render: (c) => kg(c.stockKg) },
            { label: 'Harga/kg', align: 'end', render: (c) => rupiah(c.pricePerKg) },
          ]}
        />
      </Card>

      {completing && (
        <Card title={`Selesaikan permintaan: ${completing.buyer.name} — ${completing.wasteCategory.name}`}>
          <Form
            key={completing.id}
            fields={saleFields}
            initial={{ weightKg: completing.quantityKg, pricePerKg: completing.offeredPricePerKg }}
            submitLabel="Catat penyerahan & penjualan"
            onCancel={() => setCompleting(null)}
            onSubmit={async (payload) => {
              await api.post('/sales', { ...payload, requestId: completing.id })
              setCompleting(null)
              changed()
            }}
          />
        </Card>
      )}

      <Resource<MarketRequest>
        title="Permintaan material"
        path="/marketplace/requests"
        addLabel="Buat permintaan"
        refreshKey={refresh}
        onChange={changed}
        fields={[
          ...(isMitra
            ? []
            : [{ name: 'buyerId', label: 'Pembeli', type: 'select', options: buyers, required: true } as Field]),
          { name: 'wasteCategoryId', label: 'Material', type: 'select', options: listed, required: true },
          { name: 'quantityKg', label: 'Jumlah (kg)', type: 'number', required: true, min: '0.001' },
          { name: 'offeredPricePerKg', label: 'Harga tawar per kg (Rp)', type: 'number', step: '1', min: '0' },
          { name: 'note', label: 'Catatan', type: 'textarea' },
        ]}
        columns={[
          { label: 'Tanggal', render: (r) => dateTime(r.createdAt) },
          { label: 'Pembeli', render: (r) => r.buyer.name },
          { label: 'Material', render: (r) => r.wasteCategory.name },
          { label: 'Jumlah', align: 'end', render: (r) => kg(r.quantityKg) },
          { label: 'Harga tawar', align: 'end', render: (r) => rupiah(r.offeredPricePerKg) },
          {
            label: 'Status',
            render: (r) => (
              <>
                {label(r.status)}
                {r.sale && <span className="text-secondary"> · {rupiah(r.sale.totalAmount)}</span>}
              </>
            ),
          },
          {
            label: '',
            align: 'end',
            render: (r) =>
              canManage && (
                <span className="d-inline-flex gap-1">
                  {r.status === 'PENDING' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => void decide(r, 'APPROVED')}>
                        Setujui
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => void decide(r, 'REJECTED')}>
                        Tolak
                      </button>
                    </>
                  )}
                  {r.status === 'APPROVED' && (
                    <button className="btn btn-sm btn-success" onClick={() => setCompleting(r)}>
                      Selesaikan
                    </button>
                  )}
                </span>
              ),
          },
        ]}
      />

      {canManage && (
        <>
          <Resource<Sale>
            title="Transaksi penjualan"
            path="/sales"
            addLabel="Catat penjualan langsung"
            refreshKey={refresh}
            onChange={changed}
            fields={[
              { name: 'buyerId', label: 'Pembeli', type: 'select', options: buyers, required: true },
              { name: 'wasteCategoryId', label: 'Material', type: 'select', options: listed, required: true },
              ...saleFields,
            ]}
            columns={[
              { label: 'Waktu', render: (s) => dateTime(s.soldAt) },
              { label: 'Pembeli', render: (s) => s.buyer.name },
              { label: 'Material', render: (s) => s.wasteCategory.name },
              { label: 'Berat', align: 'end', render: (s) => kg(s.weightKg) },
              { label: 'Harga/kg', align: 'end', render: (s) => rupiah(s.pricePerKg) },
              { label: 'Total', align: 'end', render: (s) => <strong>{rupiah(s.totalAmount)}</strong> },
            ]}
          />

          <Resource<Buyer>
            title="Jaringan pembeli & mitra"
            path="/buyers"
            addLabel="Tambah pembeli"
            onChange={changed}
            fields={[
              { name: 'name', label: 'Nama', required: true },
              { name: 'phone', label: 'Telepon' },
              { name: 'address', label: 'Alamat' },
              { name: 'notes', label: 'Catatan', type: 'textarea' },
            ]}
            editFields={[
              { name: 'name', label: 'Nama', required: true },
              { name: 'phone', label: 'Telepon' },
              { name: 'address', label: 'Alamat' },
              { name: 'notes', label: 'Catatan', type: 'textarea' },
              { name: 'active', label: 'Aktif', type: 'checkbox' },
            ]}
            columns={[
              { label: 'Nama', render: (b) => b.name },
              { label: 'Telepon', render: (b) => b.phone ?? '-' },
              { label: 'Alamat', render: (b) => b.address ?? '-' },
              { label: 'Catatan', render: (b) => b.notes ?? '-' },
              { label: 'Aktif', render: (b) => (b.active ? 'Ya' : 'Tidak') },
            ]}
          />
        </>
      )}
    </>
  )
}
