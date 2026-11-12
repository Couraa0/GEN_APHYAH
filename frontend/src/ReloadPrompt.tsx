import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
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
      <span>
        {offlineReady
          ? 'Aplikasi siap dipakai tanpa internet.'
          : 'Versi baru tersedia, muat ulang untuk memperbarui.'}
      </span>
      <div className="actions">
        {needRefresh && (
          <button className="btn btn-sm btn-success" onClick={() => updateServiceWorker(true)}>
            Muat ulang
          </button>
        )}
        <button className="btn btn-sm btn-outline-secondary" onClick={close}>
          Tutup
        </button>
      </div>
    </div>
  )
}
