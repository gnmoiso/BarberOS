/** "hace 5 minutos" style relative time, Spanish, coarse enough not to need i18n libs. */
export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)

  if (seconds < 10) return 'justo ahora'
  if (seconds < 60) return `hace ${Math.floor(seconds)} segundos`

  const minutes = seconds / 60
  if (minutes < 60) return `hace ${Math.floor(minutes)} minuto${Math.floor(minutes) === 1 ? '' : 's'}`

  const hours = minutes / 60
  if (hours < 24) return `hace ${Math.floor(hours)} hora${Math.floor(hours) === 1 ? '' : 's'}`

  const days = hours / 24
  if (days < 7) return `hace ${Math.floor(days)} día${Math.floor(days) === 1 ? '' : 's'}`

  const weeks = days / 7
  if (weeks < 5) return `hace ${Math.floor(weeks)} semana${Math.floor(weeks) === 1 ? '' : 's'}`

  const months = days / 30
  if (months < 12) return `hace ${Math.floor(months)} mes${Math.floor(months) === 1 ? '' : 'es'}`

  const years = days / 365
  return `hace ${Math.floor(years)} año${Math.floor(years) === 1 ? '' : 's'}`
}
