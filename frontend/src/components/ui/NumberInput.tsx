import { useEffect, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Input } from './Input'

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string
  error?: string
  /** `undefined` renders as an empty field instead of a literal 0. */
  value: number | undefined
  onValueChange: (value: number | undefined) => void
  allowDecimal?: boolean
}

/**
 * Plain `type="number"` inputs bound straight to a numeric state (defaulting to 0)
 * always render that 0 and re-insert it the instant the field is cleared (`+value || 0`
 * style coercion), so users can never fully empty the field while editing. This keeps
 * its own string draft so the field can be blank mid-edit, only reporting a number
 * (or undefined when empty) to the caller.
 */
export function NumberInput({ value, onValueChange, allowDecimal = true, ...props }: NumberInputProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value))

  useEffect(() => {
    setText(value === undefined ? '' : String(value))
  }, [value])

  return (
    <Input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={text}
      onChange={e => {
        const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g
        const raw = e.target.value.replace(pattern, '')
        setText(raw)
        onValueChange(raw === '' || raw === '.' ? undefined : Number(raw))
      }}
      {...props}
    />
  )
}
