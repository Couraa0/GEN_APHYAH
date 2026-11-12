interface StatusBadgeProps {
  isOnline: boolean
  /** Jumlah transaksi yang belum tersinkron ke server. */
  pending?: number
}

export function StatusBadge({ isOnline, pending = 0 }: StatusBadgeProps) {
  return (
    <span className="badge pwa-badge">
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
      {isOnline ? 'PWA Online' : 'PWA Offline'}
      {pending > 0 && ` · ${pending} belum sinkron`}
    </span>
  )
}
