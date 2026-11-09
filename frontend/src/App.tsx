import { useState } from 'react'
import { ReloadPrompt } from './ReloadPrompt'
import { StatusBadge } from './components/common/StatusBadge'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { fetchBackendStatus } from './services/api'
import { formatTimestamp } from './utils/formatDate'
import type { BackendStatus } from './types'
import './App.css'

function App() {
  const isOnline = useNetworkStatus()
  const [backendData, setBackendData] = useState<BackendStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckBackend = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackendStatus()
      setBackendData(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Gagal terhubung ke backend')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="badge-wrapper">
          <StatusBadge isOnline={isOnline} />
          <span className="badge">Vite + React + TS</span>
          <span className="badge">NestJS Backend</span>
        </div>
        <h1 className="title">GEN APHYAH</h1>
        <p className="subtitle">
          Modern Fullstack Starter: <strong>Vite (React + TypeScript + PWA)</strong> &amp; <strong>NestJS</strong>
        </p>
      </header>

      <main className="main-content">
        <div className="card-grid">
          {/* Card Frontend */}
          <div className="card">
            <div className="card-header">
              <span className="card-icon">⚡</span>
              <h2>Frontend (Vite + PWA)</h2>
            </div>
            <p className="card-desc">
              Aplikasi berbasis Vite, React 19, TypeScript, dan Service Worker untuk dukungan Progressive Web App (PWA).
            </p>
            <ul className="feature-list">
              <li>✅ Hot Module Replacement (HMR) super cepat</li>
              <li>✅ Dukungan Offline &amp; Service Worker otomatis</li>
              <li>✅ Manifest PWA untuk instalasi di desktop &amp; mobile</li>
              <li>✅ Struktur folder modular (components, hooks, services, types)</li>
            </ul>
          </div>

          {/* Card Backend */}
          <div className="card">
            <div className="card-header">
              <span className="card-icon">🦁</span>
              <h2>Backend (NestJS)</h2>
            </div>
            <p className="card-desc">
              Backend berbasis NestJS dengan arsitektur modular, TypeScript, Dependency Injection, dan CORS terintegrasi.
            </p>
            <ul className="feature-list">
              <li>✅ Arsitektur Controller, Service, dan Module yang terstruktur</li>
              <li>✅ CORS siap pakai untuk komunikasi frontend</li>
              <li>✅ Vitest untuk testing unit dan e2e</li>
              <li>✅ Port default: <code>http://localhost:3000</code></li>
            </ul>
          </div>
        </div>

        {/* API Integration Test Section */}
        <section className="test-section">
          <h2>Uji Koneksi Backend NestJS</h2>
          <p>
            Jalankan backend dengan <code>npm run start:dev</code> di folder <code>backend</code>, lalu klik tombol di bawah untuk mengetes komunikasi API.
          </p>

          <button
            className="action-button"
            onClick={handleCheckBackend}
            disabled={loading}
          >
            {loading ? 'Menghubungkan...' : 'Tes Koneksi Backend (/api/status)'}
          </button>

          {backendData && (
            <div className="response-box success">
              <h3>Respons Backend Berhasil:</h3>
              <p>
                <strong>Service:</strong> {backendData.service} (v{backendData.version})
              </p>
              <p>
                <strong>Status:</strong> {backendData.status}
              </p>
              <p>
                <strong>Waktu Server:</strong> {formatTimestamp(backendData.timestamp)}
              </p>
              <pre>{JSON.stringify(backendData, null, 2)}</pre>
            </div>
          )}

          {error && (
            <div className="response-box error">
              <h3>Gagal Terhubung:</h3>
              <p>{error}</p>
              <small>Pastikan server NestJS sedang berjalan pada <code>http://localhost:3000</code>.</small>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>GEN APHYAH Starter Template &bull; Vite + TypeScript + PWA &bull; NestJS</p>
      </footer>

      <ReloadPrompt />
    </div>
  )
}

export default App
