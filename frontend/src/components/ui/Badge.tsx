type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const styles: Record<BadgeVariant, string> = {
  success: 'bg-green-900/50 text-green-400 border-green-800',
  warning: 'bg-orange-900/50 text-orange-400 border-orange-800',
  danger: 'bg-red-900/50 text-red-400 border-red-800',
  info: 'bg-blue-900/50 text-blue-400 border-blue-800',
  neutral: 'bg-slate-700 text-slate-300 border-slate-600',
}

export function Badge({ label, variant = 'neutral' }: { label: string; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {label}
    </span>
  )
}
