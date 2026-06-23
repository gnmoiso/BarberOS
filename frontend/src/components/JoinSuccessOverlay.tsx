import { motion, AnimatePresence } from 'framer-motion'
import { Check, Scissors, PartyPopper } from 'lucide-react'

const confettiColors = ['#dc2626', '#3b82f6', '#facc15', '#22c55e', '#a855f7']

function Confetti() {
  const pieces = Array.from({ length: 18 })
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((_, i) => {
        const x = (Math.random() - 0.5) * 280
        const delay = Math.random() * 0.3
        const color = confettiColors[i % confettiColors.length]
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/3 w-2 h-2 rounded-sm"
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y: 220 + Math.random() * 80, opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

/** Celebratory full-screen confirmation shown right after joining a barbershop —
 * via manual code or a scanned QR — so the moment feels rewarding instead of a
 * silent redirect. */
export function JoinSuccessOverlay({ tenantName, onContinue }: { tenantName: string; onContinue: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative w-full max-w-sm text-center">
          <Confetti />

          <motion.div
            className="relative w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/15 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.3 }}
            >
              <Check className="w-12 h-12 text-green-400" strokeWidth={3} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="w-5 h-5 text-yellow-400" />
              <h2 className="text-2xl font-black text-white">¡Listo!</h2>
              <PartyPopper className="w-5 h-5 text-yellow-400 scale-x-[-1]" />
            </div>
            <p className="text-zinc-300 text-lg">
              Te uniste a <span className="text-red-500 font-bold">{tenantName}</span>
            </p>
            <p className="text-zinc-500 text-sm mt-1 flex items-center justify-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" /> Ya puedes reservar tu próxima cita
            </p>
          </motion.div>

          <motion.button
            onClick={onContinue}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            Continuar
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
