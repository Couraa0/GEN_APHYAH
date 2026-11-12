import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import { ReloadPrompt } from './ReloadPrompt'
import { StatusBadge } from './components/common/StatusBadge'
import { LoginPage } from './features/auth/LoginPage'
import { CollectionPage } from './features/collection/CollectionPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { InventoryPage } from './features/inventory/InventoryPage'
import { MarketplacePage } from './features/marketplace/MarketplacePage'
import { MasterPage } from './features/master/MasterPage'
import { OrganicPage } from './features/organic/OrganicPage'
import { PickupsPage } from './features/pickups/PickupsPage'
import { PlasticPage } from './features/plastic/PlasticPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { useQueue } from './hooks/useQueue'
import { LOGOUT_EVENT, session, syncQueue } from './services/api'
import { label } from './utils/format'

const STAFF_NAV = [
  { to: '/', label: 'Beranda' },
  { to: '/pengumpulan', label: 'Pengumpulan' },
  { to: '/stok', label: 'Stok Material' },
  { to: '/pengangkutan', label: 'Pengangkutan' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/organik', label: 'Maggot BSF' },
  { to: '/plastik', label: 'Paving Block' },
  { to: '/laporan', label: 'Laporan' },
  { to: '/data', label: 'Data Master' },
]
const MITRA_NAV = [{ to: '/marketplace', label: 'Marketplace' }]

function App() {
  const [user, setUser] = useState(session.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const isOnline = useNetworkStatus()
  const pending = useQueue()

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener(LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout)
  }, [])

  // Kirim antrean offline saat aplikasi dibuka, koneksi kembali, atau tab aktif lagi.
  useEffect(() => {
    if (!user) return
    const sync = () => {
      if (document.visibilityState === 'visible') void syncQueue()
    }
    sync()
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [user])

  if (!user) {
    return (
      <>
        <LoginPage onLogin={setUser} isOnline={isOnline} />
        <ReloadPrompt />
      </>
    )
  }

  const isMitra = user.role === 'MITRA'
  const nav = isMitra ? MITRA_NAV : STAFF_NAV
  const badge = <StatusBadge isOnline={isOnline} pending={pending.length} />

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="btn btn-sm btn-outline-light"
          aria-label="Buka menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
        <strong className="me-auto">RUNA</strong>
        {badge}
      </header>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
      <nav className={`sidebar${menuOpen ? ' open' : ''}`} aria-label="Menu utama">
        <div className="brand">
          RUNA
          <small>Circular Integration</small>
        </div>
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}>
            {item.label}
          </NavLink>
        ))}
        <div className="account">
          <div className="mb-2">{badge}</div>
          <div className="fw-semibold">{user.name}</div>
          <div className="opacity-75 mb-2">{label(user.role)}</div>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => {
              // Antrean tetap di perangkat; akan terkirim atas nama akun yang login berikutnya.
              const ok =
                !pending.length ||
                confirm(`Masih ada ${pending.length} transaksi belum tersinkron. Tetap keluar?`)
              if (ok) session.clear()
            }}
          >
            Keluar
          </button>
        </div>
      </nav>

      <main className="content">
        <Routes>
          {isMitra ? (
            <Route path="/marketplace" element={<MarketplacePage user={user} />} />
          ) : (
            <>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/pengumpulan" element={<CollectionPage />} />
              <Route path="/stok" element={<InventoryPage user={user} />} />
              <Route path="/pengangkutan" element={<PickupsPage user={user} />} />
              <Route path="/marketplace" element={<MarketplacePage user={user} />} />
              <Route path="/organik" element={<OrganicPage />} />
              <Route path="/plastik" element={<PlasticPage />} />
              <Route path="/laporan" element={<ReportsPage />} />
              <Route path="/data" element={<MasterPage user={user} />} />
            </>
          )}
          <Route path="*" element={<Navigate to={isMitra ? '/marketplace' : '/'} replace />} />
        </Routes>
      </main>

      <ReloadPrompt />
    </div>
  )
}

export default App
