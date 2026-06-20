import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`bg-slate-800 border border-slate-700 rounded-2xl ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
