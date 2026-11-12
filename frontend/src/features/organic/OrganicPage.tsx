import { useState } from 'react'
import { Card, Form, StaleNote, Table } from '../../components/Resource'
import { useApi } from '../../hooks/useApi'
import { api } from '../../services/api'
import type { OrganicBatch } from '../../types'
import { dateTime, kg, label, options } from '../../utils/format'

const totalKg = (batch: OrganicBatch, type: string) =>
  batch.records.filter((r) => r.type === type).reduce((total, r) => total + Number(r.weightKg ?? 0), 0)

export function OrganicPage() {
  const { data, error, cachedAt, reload } = useApi<OrganicBatch[]>('/organic/batches')
  const [adding, setAdding] = useState(false)

  async function close(batch: OrganicBatch) {
    if (!confirm(`Tutup batch ${batch.code}? Batch yang ditutup tidak bisa ditambah catatan.`)) return
    await api.patch(`/organic/batches/${batch.id}`, { status: 'CLOSED' }).catch((err: Error) => alert(err.message))
    reload()
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Pilot Maggot BSF</h1>
        {!adding && (
          <button className="btn btn-sm btn-success" onClick={() => setAdding(true)}>
            + Batch baru
          </button>
        )}
      </div>
      <p className="text-secondary">
        Pencatatan batch budidaya: pakan organik, observasi, panen larva, dan residu/frass. Aplikasi
        hanya mencatat; proses budidaya tetap dikelola operator.
      </p>
      <StaleNote at={cachedAt} error={error} />

      {adding && (
        <Card title="Batch baru">
          <Form
            fields={[
              { name: 'code', label: 'Kode batch', required: true, help: 'Mis. BSF-001' },
              { name: 'startedAt', label: 'Mulai', type: 'datetime-local', required: true },
              { name: 'notes', label: 'Catatan', type: 'textarea' },
            ]}
            onCancel={() => setAdding(false)}
            onSubmit={async (payload) => {
              await api.post('/organic/batches', payload)
              setAdding(false)
              reload()
            }}
          />
        </Card>
      )}

      {data?.length === 0 && <p className="text-secondary">Belum ada batch.</p>}

      {data?.map((batch) => (
        <Card
          key={batch.id}
          title={`${batch.code} · ${label(batch.status)}`}
          actions={
            batch.status === 'ACTIVE' && (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => void close(batch)}>
                Tutup batch
              </button>
            )
          }
        >
          <p className="small text-secondary">
            Mulai {dateTime(batch.startedAt)}
            {batch.notes && ` · ${batch.notes}`}
          </p>
          <p>
            Pakan <strong>{kg(totalKg(batch, 'FEEDING'))}</strong> · Panen larva{' '}
            <strong>{kg(totalKg(batch, 'HARVEST'))}</strong> · Residu/frass{' '}
            <strong>{kg(totalKg(batch, 'FRASS'))}</strong>
          </p>

          {batch.status === 'ACTIVE' && (
            <div className="border rounded p-3 mb-3 bg-body-tertiary">
              <Form
                submitLabel="Tambah catatan"
                fields={[
                  {
                    name: 'type',
                    label: 'Jenis catatan',
                    type: 'select',
                    required: true,
                    options: options('FEEDING', 'OBSERVATION', 'HARVEST', 'FRASS'),
                  },
                  { name: 'weightKg', label: 'Berat (kg)', type: 'number', min: '0.001', help: 'Kosongkan untuk observasi.' },
                  { name: 'recordedAt', label: 'Waktu', type: 'datetime-local', required: true },
                  { name: 'note', label: 'Catatan', type: 'textarea' },
                ]}
                onSubmit={async (payload) => {
                  await api.post(`/organic/batches/${batch.id}/records`, payload)
                  reload()
                }}
              />
            </div>
          )}

          <Table
            rows={batch.records}
            empty="Belum ada catatan."
            columns={[
              { label: 'Waktu', render: (r) => dateTime(r.recordedAt) },
              { label: 'Jenis', render: (r) => label(r.type) },
              { label: 'Berat', align: 'end', render: (r) => kg(r.weightKg) },
              { label: 'Catatan', render: (r) => r.note ?? '-' },
            ]}
          />
        </Card>
      ))}
    </>
  )
}
