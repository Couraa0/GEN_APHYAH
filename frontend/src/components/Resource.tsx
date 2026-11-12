// Form, tabel, dan gabungan keduanya (Resource) yang dipakai hampir semua halaman modul.
import { useId, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import { dateTime, toLocalInput } from '../utils/format'

export interface Field {
  name: string
  label: string
  type?: 'text' | 'number' | 'datetime-local' | 'select' | 'textarea' | 'checkbox' | 'password'
  options?: { value: string; label: string }[]
  required?: boolean
  /** Untuk type number. Default 0.001 (gram). */
  step?: string
  min?: string
  help?: string
  /** Nilai awal form baru. datetime-local tanpa default = waktu sekarang. */
  default?: string | boolean
}

type Values = Record<string, string | boolean>

function initialValues(fields: Field[], initial?: Record<string, unknown>): Values {
  const values: Values = {}
  for (const f of fields) {
    const raw = initial?.[f.name]
    if (f.type === 'checkbox') values[f.name] = Boolean(raw ?? f.default ?? false)
    else if (f.type === 'datetime-local')
      values[f.name] = toLocalInput(raw ? new Date(String(raw)) : new Date())
    else values[f.name] = raw == null ? String(f.default ?? '') : String(raw)
  }
  return values
}

function toPayload(fields: Field[], values: Values) {
  const payload: Record<string, unknown> = {}
  for (const f of fields) {
    const value = values[f.name]
    if (f.type === 'checkbox') payload[f.name] = Boolean(value)
    else if (value === '') continue // kolom opsional yang kosong tidak dikirim
    else if (f.type === 'number') payload[f.name] = Number(value)
    else if (f.type === 'datetime-local') payload[f.name] = new Date(String(value)).toISOString()
    else payload[f.name] = value
  }
  return payload
}

interface FormProps {
  fields: Field[]
  initial?: Record<string, unknown>
  submitLabel?: string
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>
  onCancel?: () => void
}

export function Form({ fields, initial, submitLabel = 'Simpan', onSubmit, onCancel }: FormProps) {
  const formId = useId()
  const [values, setValues] = useState(() => initialValues(fields, initial))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (name: string, value: string | boolean) => setValues((v) => ({ ...v, [name]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(toPayload(fields, values))
      setValues(initialValues(fields, initial))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="row g-2 align-items-end" onSubmit={submit}>
      {fields.map((f) => {
        const id = `${formId}-${f.name}`
        const value = values[f.name]
        if (f.type === 'checkbox') {
          return (
            <div className="col-12 col-md-6 col-lg-4" key={f.name}>
              <div className="form-check">
                <input
                  id={id}
                  type="checkbox"
                  className="form-check-input"
                  checked={Boolean(value)}
                  onChange={(e) => set(f.name, e.target.checked)}
                />
                <label className="form-check-label" htmlFor={id}>
                  {f.label}
                </label>
              </div>
            </div>
          )
        }
        const common = {
          id,
          required: f.required,
          value: String(value),
          onChange: (e: { target: { value: string } }) => set(f.name, e.target.value),
        }
        return (
          <div className={f.type === 'textarea' ? 'col-12' : 'col-12 col-md-6 col-lg-4'} key={f.name}>
            <label className="form-label mb-1 small fw-semibold" htmlFor={id}>
              {f.label}
              {f.required && <span className="text-danger"> *</span>}
            </label>
            {f.type === 'select' ? (
              <select className="form-select" {...common}>
                <option value="">{f.required ? 'Pilih…' : '(tidak ada)'}</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea className="form-control" rows={2} {...common} />
            ) : (
              <input
                className="form-control"
                type={f.type ?? 'text'}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                step={f.type === 'number' ? (f.step ?? '0.001') : undefined}
                min={f.min}
                autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                {...common}
              />
            )}
            {f.help && <div className="form-text">{f.help}</div>}
          </div>
        )
      })}
      {error && (
        <div className="col-12">
          <div className="alert alert-danger py-2 mb-0" role="alert">
            {error}
          </div>
        </div>
      )}
      <div className="col-12 d-flex gap-2">
        <button className="btn btn-success" disabled={busy}>
          {busy ? 'Menyimpan…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Batal
          </button>
        )}
      </div>
    </form>
  )
}

export interface Column<T> {
  label: string
  render: (row: T) => ReactNode
  align?: 'end'
}

export function Table<T extends { id: string }>({
  columns,
  rows,
  empty = 'Belum ada data.',
}: {
  columns: Column<T>[]
  rows: T[] | undefined
  empty?: string
}) {
  if (!rows) return <p className="text-secondary mb-0">Memuat…</p>
  if (!rows.length) return <p className="text-secondary mb-0">{empty}</p>
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} className={c.align === 'end' ? 'text-end' : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.label} className={c.align === 'end' ? 'text-end' : undefined}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Penanda bahwa data yang tampil adalah data offline, beserta waktu sinkron terakhir. */
export function StaleNote({ at, error }: { at?: number | null; error?: string }) {
  if (at) {
    return (
      <div className="alert alert-warning py-2" role="status">
        Offline — menampilkan data terakhir per {dateTime(at)}.
      </div>
    )
  }
  return error ? (
    <div className="alert alert-danger py-2" role="alert">
      {error}
    </div>
  ) : null
}

export function Card({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 mb-0">{title}</h2>
          {actions}
        </div>
        {children}
      </div>
    </section>
  )
}

interface ResourceProps<T> {
  title: string
  /** Endpoint daftar, mis. "/buyers". POST ke path yang sama, PATCH ke path/:id. */
  path: string
  columns: Column<T>[]
  /** Kolom form tambah. Kosong = hanya daftar. */
  fields?: Field[]
  /** Kolom form ubah (PATCH). Kosong = baris tidak bisa diubah. */
  editFields?: Field[]
  /** Path POST bila berbeda dari path daftar. */
  createPath?: string
  addLabel?: string
  empty?: string
  /** Dipanggil setelah data berubah, untuk memuat ulang bagian lain halaman. */
  onChange?: () => void
  /** Ubah angka ini untuk memaksa daftar dimuat ulang dari luar. */
  refreshKey?: number
}

export function Resource<T extends { id: string }>({
  title,
  path,
  columns,
  fields,
  editFields,
  createPath = path,
  addLabel = 'Tambah',
  empty,
  onChange,
  refreshKey = 0,
}: ResourceProps<T>) {
  const { data, error, cachedAt, reload } = useApi<T[]>(path, refreshKey)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)

  const done = () => {
    setAdding(false)
    setEditing(null)
    reload()
    onChange?.()
  }

  const allColumns: Column<T>[] = editFields
    ? [
        ...columns,
        {
          label: '',
          align: 'end',
          render: (row) => (
            <button className="btn btn-sm btn-outline-success" onClick={() => setEditing(row)}>
              Ubah
            </button>
          ),
        },
      ]
    : columns

  return (
    <Card
      title={title}
      actions={
        fields &&
        !adding &&
        !editing && (
          <button className="btn btn-sm btn-success" onClick={() => setAdding(true)}>
            + {addLabel}
          </button>
        )
      }
    >
      <StaleNote at={cachedAt} error={error} />
      {adding && fields && (
        <div className="border rounded p-3 mb-3 bg-body-tertiary">
          <Form
            fields={fields}
            onSubmit={(payload) => api.post(createPath, payload).then(done)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
      {editing && editFields && (
        <div className="border rounded p-3 mb-3 bg-body-tertiary">
          <Form
            key={editing.id}
            fields={editFields}
            initial={editing as Record<string, unknown>}
            submitLabel="Simpan perubahan"
            onSubmit={(payload) => api.patch(`${path}/${editing.id}`, payload).then(done)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      <Table columns={allColumns} rows={data} empty={empty} />
    </Card>
  )
}
