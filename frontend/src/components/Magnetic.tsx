import { motion, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Magnetic hover: content drifts up to ±6px toward the cursor, springing back on leave. */
export default function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const x = useSpring(0, { stiffness: 300, damping: 20, mass: 0.4 })
  const y = useSpring(0, { stiffness: 300, damping: 20, mass: 0.4 })

  return (
    <motion.div
      className={cn('inline-block', className)}
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set(Math.max(-6, Math.min(6, (e.clientX - r.left - r.width / 2) * 0.25)))
        y.set(Math.max(-6, Math.min(6, (e.clientY - r.top - r.height / 2) * 0.25)))
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
