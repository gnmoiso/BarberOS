/** Colombian peso formatting: period as thousands separator, no decimals (e.g. 20.000). */
export function formatCOP(value: number): string {
  return value.toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

export function formatCurrency(value: number, currency = 'COP'): string {
  return `$${formatCOP(value)}${currency !== 'COP' ? ` ${currency}` : ''}`
}
