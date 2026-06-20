import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

const variants = {
  primary: 'bg-red-600 hover:bg-red-700 text-slate-900 font-semibold',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'hover:bg-slate-700 text-slate-300',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as object)}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  )
}
