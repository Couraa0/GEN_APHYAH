interface StatusBadgeProps {
  isOnline: boolean
}

export function StatusBadge({ isOnline }: StatusBadgeProps) {
  return (
    <span className="badge pwa-badge">
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
      {isOnline ? 'PWA Online' : 'PWA Offline Mode'}
    </span>
  )
}

