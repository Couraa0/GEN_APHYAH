import { Resource } from '../../components/Resource'
import type { Field } from '../../components/Resource'
import { useOptions } from '../../hooks/useApi'
import type { Category, CollectionPoint, Household, User } from '../../types'
import { label, options, rupiah } from '../../utils/format'

const active: Field = { name: 'active', label: 'Aktif', type: 'checkbox' }
const yesNo = (value: unknown) => (value ? 'Ya' : 'Tidak')

const householdFields: Field[] = [
  { name: 'name', label: 'Nama kepala keluarga / nasabah', required: true },
  { name: 'address', label: 'Alamat' },
  { name: 'rt', label: 'RT' },
  { name: 'rw', label: 'RW' },
  { name: 'phone', label: 'Telepon' },
]
const pointFields: Field[] = [
  { name: 'name', label: 'Nama titik', required: true },
  { name: 'description', label: 'Keterangan', type: 'textarea' },
]
const categoryFields: Field[] = [
  { name: 'name', label: 'Nama kategori', required: true },
  {
    name: 'group',
    label: 'Kelompok',
    type: 'select',
    required: true,
    default: 'ANORGANIK',
    options: options('ANORGANIK', 'ORGANIK', 'RESIDU'),
  },
  { name: 'pricePerKg', label: 'Harga per kg (Rp)', type: 'number', step: '1', min: '0' },
  { name: 'listed', label: 'Tampil di katalog marketplace', type: 'checkbox' },
]

export function MasterPage({ user }: { user: User }) {
  const canManage = user.role !== 'PETUGAS'
  const isAdmin = user.role === 'ADMIN'
  const buyers = useOptions(isAdmin ? '/buyers' : null)
  const roles = options('ADMIN', 'PENGURUS', 'PETUGAS', 'MITRA')

  return (
    <>
      <h1 className="h4 mb-3">Data Master</h1>

      <Resource<Household>
        title="Rumah tangga / nasabah"
        path="/households"
        addLabel="Tambah rumah tangga"
        fields={householdFields}
        editFields={[...householdFields, active]}
        columns={[
          { label: 'Nama', render: (h) => h.name },
          { label: 'Alamat', render: (h) => h.address ?? '-' },
          { label: 'RT/RW', render: (h) => `${h.rt ?? '-'}/${h.rw ?? '-'}` },
          { label: 'Telepon', render: (h) => h.phone ?? '-' },
          { label: 'Setoran', align: 'end', render: (h) => h._count?.collections ?? 0 },
          { label: 'Aktif', render: (h) => yesNo(h.active) },
        ]}
      />

      <Resource<CollectionPoint>
        title="Titik pengumpulan"
        path="/collection-points"
        addLabel="Tambah titik"
        fields={canManage ? pointFields : undefined}
        editFields={canManage ? [...pointFields, active] : undefined}
        columns={[
          { label: 'Nama', render: (p) => p.name },
          { label: 'Keterangan', render: (p) => p.description ?? '-' },
          { label: 'Aktif', render: (p) => yesNo(p.active) },
        ]}
      />

      <Resource<Category>
        title="Kategori sampah"
        path="/categories"
        addLabel="Tambah kategori"
        fields={canManage ? categoryFields : undefined}
        editFields={canManage ? [...categoryFields, active] : undefined}
        columns={[
          { label: 'Nama', render: (c) => c.name },
          { label: 'Kelompok', render: (c) => label(c.group) },
          { label: 'Harga/kg', align: 'end', render: (c) => rupiah(c.pricePerKg) },
          { label: 'Di katalog', render: (c) => yesNo(c.listed) },
          { label: 'Aktif', render: (c) => yesNo(c.active) },
        ]}
      />

      {canManage && (
        <Resource<User>
          title="Pengguna"
          path="/users"
          addLabel="Tambah pengguna"
          fields={
            isAdmin
              ? [
                  { name: 'name', label: 'Nama', required: true },
                  { name: 'username', label: 'Username', required: true, help: 'Huruf kecil, angka, titik, - atau _.' },
                  { name: 'password', label: 'Password', type: 'password', required: true, help: 'Minimal 8 karakter.' },
                  { name: 'role', label: 'Role', type: 'select', options: roles, required: true },
                  { name: 'buyerId', label: 'Pembeli (khusus role Mitra)', type: 'select', options: buyers },
                ]
              : undefined
          }
          editFields={
            isAdmin
              ? [
                  { name: 'name', label: 'Nama', required: true },
                  { name: 'role', label: 'Role', type: 'select', options: roles, required: true },
                  { name: 'password', label: 'Password baru', type: 'password', help: 'Kosongkan bila tidak diganti.' },
                  active,
                ]
              : undefined
          }
          columns={[
            { label: 'Nama', render: (u) => u.name },
            { label: 'Username', render: (u) => u.username },
            { label: 'Role', render: (u) => label(u.role) },
            { label: 'Aktif', render: (u) => yesNo(u.active) },
          ]}
        />
      )}
    </>
  )
}
