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
          ? 'Tidak dapat terhubung ke server. Masuk membutuhkan internet.'
          : (err as Error).message,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1 className="title">RUNA</h1>
        <p className="fw-semibold mb-1">Circular Integration</p>
        <p className="text-secondary">Bank Sampah RUNA, Desa Cibunian</p>

        <label className="form-label fw-semibold" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="form-control form-control-lg mb-3"
          autoComplete="username"
          autoCapitalize="none"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="form-label fw-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="form-control form-control-lg mb-3"
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
        <button className="btn btn-success btn-lg w-100 mb-3" disabled={busy}>
          {busy ? 'Masuk…' : 'Masuk'}
        </button>
        <StatusBadge isOnline={isOnline} />
      </form>

      {/* Perbukitan Cibunian: tiga lapis bukit, makin dekat makin gelap. */}
      <svg className="bukit" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#d3e7d5" d="M0 150C220 70 430 95 660 150S1130 60 1440 130V320H0Z" />
        <path fill="#86c08d" d="M0 215C210 150 400 175 620 215S1090 130 1440 195V320H0Z" />
        <path fill="#0e5a36" d="M0 275C260 225 520 250 770 272S1210 215 1440 255V320H0Z" />
      </svg>
    </div>
  )
}
