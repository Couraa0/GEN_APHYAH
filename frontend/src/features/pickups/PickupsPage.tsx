import { Resource } from '../../components/Resource'
import { useOptions } from '../../hooks/useApi'
import type { Pickup, User } from '../../types'
import { dateTime, kg, label, options } from '../../utils/format'

export function PickupsPage({ user }: { user: User }) {
  const canManage = user.role !== 'PETUGAS'
  const points = useOptions('/collection-points')
  const users = useOptions(canManage ? '/users' : null)

  return (
    <>
      <h1 className="mb-3">Pengangkutan</h1>
      <p className="text-secondary">
        Pengangkutan memindahkan material dari titik ke RUNA atau pengepul. Berat yang dipindahkan
        dicatat tersendiri dan tidak dihitung sebagai pengumpulan baru.
      </p>
      <Resource<Pickup>
        title="Jadwal pengangkutan"
        path="/pickups"
        addLabel="Buat jadwal"
        fields={
          canManage
            ? [
                { name: 'collectionPointId', label: 'Titik', type: 'select', options: points, required: true },
                { name: 'scheduledAt', label: 'Jadwal', type: 'datetime-local', required: true },
                { name: 'assignedToId', label: 'Petugas', type: 'select', options: users },
                { name: 'notes', label: 'Catatan', type: 'textarea' },
              ]
            : undefined
        }
        editFields={[
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: options('SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED'),
          },
          {
            name: 'movedWeightKg',
            label: 'Berat dipindahkan (kg)',
            type: 'number',
            min: '0',
            help: 'Wajib diisi saat status Selesai.',
          },
          { name: 'handedOverTo', label: 'Diserahkan kepada', help: 'Pengepul atau mitra penerima.' },
          { name: 'notes', label: 'Catatan', type: 'textarea' },
        ]}
        columns={[
          { label: 'Jadwal', render: (p) => dateTime(p.scheduledAt) },
          { label: 'Titik', render: (p) => p.collectionPoint.name },
          { label: 'Petugas', render: (p) => p.assignedTo?.name ?? '-' },
          { label: 'Status', render: (p) => label(p.status) },
          { label: 'Dipindahkan', align: 'end', render: (p) => kg(p.movedWeightKg) },
          { label: 'Diserahkan kepada', render: (p) => p.handedOverTo ?? '-' },
        ]}
      />
    </>
  )
}
