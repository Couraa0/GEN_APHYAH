export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    })
  } catch {
    return isoString
  }
}

