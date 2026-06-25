export function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)

  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}