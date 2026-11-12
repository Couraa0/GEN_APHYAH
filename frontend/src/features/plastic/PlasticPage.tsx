import { Resource } from '../../components/Resource'
import type { Field } from '../../components/Resource'
import { useOptions } from '../../hooks/useApi'
import type { PlasticExperiment } from '../../types'
import { dateTime, kg } from '../../utils/format'

const detailFields: Field[] = [
  { name: 'prototypeCount', label: 'Jumlah prototipe', type: 'number', step: '1', min: '0' },
  { name: 'partner', label: 'Mitra produksi / pendamping teknis' },
  { name: 'composition', label: 'Komposisi material', type: 'textarea' },
  { name: 'method', label: 'Metode', type: 'textarea' },
  { name: 'testResult', label: 'Hasil pengujian', type: 'textarea' },
  { name: 'evaluation', label: 'Catatan evaluasi', type: 'textarea' },
]

export function PlasticPage() {
  const categories = useOptions('/categories')

  return (
    <>
      <h1 className="h4 mb-3">Pilot Paving Block Plastik</h1>
      <div className="alert alert-warning" role="note">
        Prototipe belum boleh dianggap layak dipakai atau dipasarkan sebelum lolos pengujian teknis
        dan keselamatan.
      </div>
      <Resource<PlasticExperiment>
        title="Eksperimen"
        path="/plastic/experiments"
        addLabel="Catat eksperimen"
        fields={[
          { name: 'code', label: 'Kode eksperimen', required: true, help: 'Mis. PB-001' },
          {
            name: 'wasteCategoryId',
            label: 'Jenis plastik (dari stok)',
            type: 'select',
            options: categories,
            required: true,
          },
          {
            name: 'plasticWeightKg',
            label: 'Berat plastik (kg)',
            type: 'number',
            min: '0.001',
            required: true,
            help: 'Dikeluarkan dari stok sebagai pengolahan.',
          },
          { name: 'conductedAt', label: 'Waktu', type: 'datetime-local', required: true },
          ...detailFields,
        ]}
        editFields={detailFields}
        columns={[
          { label: 'Kode', render: (e) => e.code },
          { label: 'Waktu', render: (e) => dateTime(e.conductedAt) },
          { label: 'Plastik', render: (e) => `${e.wasteCategory.name} · ${kg(e.plasticWeightKg)}` },
          { label: 'Prototipe', align: 'end', render: (e) => e.prototypeCount },
          { label: 'Mitra', render: (e) => e.partner ?? '-' },
          { label: 'Hasil pengujian', render: (e) => e.testResult ?? 'Belum diuji' },
        ]}
      />
    </>
  )
}
