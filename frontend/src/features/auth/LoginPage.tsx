import { useState } from 'react'
import type { FormEvent } from 'react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { api } from '../../services/api'
import type { User } from '../../types'

export function LoginPage({ onLogin, isOnline }: { onLogin: (user: User) => void; isOnline: boolean }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onLogin(await api.login(username, password))
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Tidak dapat terhubung ke server. Login membutuhkan internet.'
          : (err as Error).message,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="card shadow p-4 w-100" style={{ maxWidth: 380 }} onSubmit={submit}>
        <div className="mb-3">
          <StatusBadge isOnline={isOnline} />
        </div>
        <h1 className="h3 mb-0 title">RUNA Circular Integration</h1>
        <p className="text-secondary">Bank Sampah RUNA · Desa Cibunian</p>

        <label className="form-label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="form-control mb-3"
          autoComplete="username"
          autoCapitalize="none"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="form-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="form-control mb-3"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-success w-100" disabled={busy}>
          {busy ? 'Masuk…' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
