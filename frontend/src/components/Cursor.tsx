import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Custom desktop cursor: 8px ink dot + 32px hairline ring (spring-lagged).
 * Ring scales x1.8 and shows a label over [data-cursor] targets.
 * Disabled on touch devices and when prefers-reduced-motion is set.
 */
export default function Cursor() {
  // Resolved after hydration so SSR and client markup agree.
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    setEnabled(
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
  }, [])
  const [label, setLabel] = useState('')
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.7 })
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.7 })

  useEffect(() => {
    if (!enabled) return
    document.body.classList.add('custom-cursor')
    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const hit = target?.closest?.('[data-cursor]')
      setLabel(hit ? hit.getAttribute('data-cursor') ?? '' : '')
    }
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    return () => {
      document.body.classList.remove('custom-cursor')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-1 -mt-1 h-2 w-2 rounded-full bg-ink mix-blend-difference"
        style={{ x, y }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 mix-blend-difference"
        style={{ x: ringX, y: ringY }}
        animate={{ scale: label ? 1.8 : 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {label ? (
          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-white">{label}</span>
        ) : null}
      </motion.div>
    </>
  )
}
