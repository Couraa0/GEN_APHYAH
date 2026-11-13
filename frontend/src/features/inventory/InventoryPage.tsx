import { useState } from 'react'
import { Card, Resource, StaleNote } from '../../components/Resource'
import { useApi, useOptions } from '../../hooks/useApi'
import type { Category, Movement, User } from '../../types'
import { dateTime, kg, label, rupiah } from '../../utils/format'

export function InventoryPage({ user }: { user: User }) {
  const canManage = user.role !== 'PETUGAS'
  const [refresh, setRefresh] = useState(0)
  const stock = useApi<Category[]>('/inventory', refresh)
  const categories = useOptions('/categories')
  const maxStock = Math.max(...(stock.data ?? []).map((c) => Number(c.stockKg ?? 0)), 1)

  return (
    <>
      <h1 className="mb-3">Stok Material</h1>

      <Card title="Stok saat ini">
        <StaleNote at={stock.cachedAt} error={stock.error} />
        <ul className="batang-list">
          {stock.data?.map((c) => (
            <li key={c.id}>
              <span>
                <i className={`dot ${c.group}`} />
                {c.name}{' '}
                <small>
                  {label(c.group)}
                  {c.pricePerKg != null && `, ${rupiah(c.pricePerKg)}/kg`}
                </small>
              </span>
              <strong>{kg(c.stockKg)}</strong>
              <div className="meter" aria-hidden="true">
                <div style={{ width: `${(Number(c.stockKg ?? 0) / maxStock) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="form-text mb-0 mt-3">
          Stok dihitung dari riwayat pergerakan di bawah: masuk dari pengumpulan, keluar karena
          penjualan, pengolahan, atau penyesuaian.
        </p>
      </Card>

      <Resource<Movement>
        title="Riwayat pergerakan stok"
        path="/inventory/movements"
        addLabel="Penyesuaian stok"
        onChange={() => setRefresh((n) => n + 1)}
        fields={
          canManage
            ? [
                { name: 'wasteCategoryId', label: 'Material', type: 'select', options: categories, required: true },
                {
                  name: 'quantityKg',
                  label: 'Jumlah (kg)',
                  type: 'number',
                  required: true,
                  help: 'Positif menambah stok, negatif mengurangi (mis. -2,5).',
                },
                { name: 'note', label: 'Alasan', required: true, help: 'Mis. koreksi timbang, susut, rusak.' },
              ]
            : undefined
        }
        columns={[
          { label: 'Waktu', render: (m) => dateTime(m.createdAt) },
          { label: 'Material', render: (m) => m.wasteCategory.name },
          { label: 'Jenis', render: (m) => label(m.type) },
          {
            label: 'Jumlah',
            align: 'end',
            render: (m) => (
              <span className={Number(m.quantityKg) < 0 ? 'text-danger' : 'text-success'}>
                {Number(m.quantityKg) > 0 && '+'}
                {kg(m.quantityKg)}
              </span>
            ),
          },
          { label: 'Catatan', render: (m) => m.note ?? '-' },
          { label: 'Oleh', render: (m) => m.recordedBy.name },
        ]}
      />
    </>
  )
}
