import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-slate-300 font-medium">{label}</label>}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-slate-800 border
          text-slate-100 placeholder-slate-500 text-sm outline-none
          transition-colors focus:border-red-600
          ${error ? 'border-red-500' : 'border-slate-600'}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
