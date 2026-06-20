/** Colombian phone rule (23.17.3): exactly 10 digits, numbers only. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function validatePhone(value: string, required = false): string | null {
  if (!value) return required ? 'El número debe tener 10 dígitos.' : null
  if (!/^\d*$/.test(value)) return 'Solo se permiten números.'
  if (value.length < 10) return 'El número debe tener 10 dígitos.'
  if (value.length > 10) return 'El número debe tener exactamente 10 dígitos.'
  return null
}
