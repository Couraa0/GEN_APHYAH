import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="pwa-toast" role="alert">
      <div className="message">
        {offlineReady ? (
          <span>Aplikasi siap dijalankan secara offline!</span>
        ) : (
          <span>Konten baru tersedia, klik untuk memperbarui.</span>
        )}
      </div>
      <div className="actions">
        {needRefresh && (
          <button className="btn-action" onClick={() => updateServiceWorker(true)}>
            Muat Ulang
          </button>
        )}
        <button className="btn-close" onClick={close}>
          Tutup
        </button>
      </div>
    </div>
  )
}

