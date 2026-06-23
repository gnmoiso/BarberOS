import { useEffect, useState } from 'react'
import { timeAgo } from '@/utils/timeAgo'

/** Self-updating "hace X minutos" label — ticks on its own so the relative time stays fresh
 * without the parent feed having to re-render (which would defeat the point of patching posts
 * in place instead of replacing the whole array). */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  return <span className={className}>{timeAgo(iso)}</span>
}
