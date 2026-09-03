import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { getLenis } from '@/lib/lenis'
import { prefersReducedMotion } from '@/lib/anim'
import mark from '@/assets/arcwell-mark.png.asset.json'

const EASE = [0.76, 0, 0.24, 1] as const
const EASE_OUT = [0.16, 1, 0.3, 1] as const

/**
 * Premium black/white intro preloader.
 * Ring + masked contour mark, tabular counter 000-100, hairline scan,
 * then a 3-column shutter wipe reveals the site. Once per session.
 */
export default function Preloader() {
  const [active, setActive] = useState(true)
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) {
      setActive(false)
      return
    }


    const lenis = getLenis()
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'

    const duration = 2200
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out-expo counter so numbers feel weighted, not linear
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setProgress(Math.round(eased * 100))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setExiting(true)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf.current)
      document.documentElement.style.overflow = ''
      getLenis()?.start()
    }
  }, [])

  useEffect(() => {
    if (!exiting) return
    const id = window.setTimeout(() => {
      setActive(false)
      document.documentElement.style.overflow = ''
      const lenis = getLenis()
      lenis?.start()
      lenis?.scrollTo(0, { immediate: true })
    }, 1150)
    return () => window.clearTimeout(id)
  }, [exiting])

  return (
    <motion.div
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-bg ${active ? '' : 'pointer-events-none invisible'}`}
      aria-hidden={!active || exiting}
      role="status"
      aria-live="polite"
    >
          {/* shutter columns that lift away on exit */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-full flex-1 border-r border-hairline/60 bg-bg last:border-r-0"
                initial={{ y: 0 }}
                animate={exiting ? { y: '-101%' } : { y: 0 }}
                transition={{ duration: 0.95, ease: EASE, delay: exiting ? i * 0.07 : 0 }}
              />
            ))}
          </div>

          {/* centrepiece */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-6"
            animate={exiting ? { opacity: 0, y: -24, filter: 'blur(4px)' } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <div className="relative grid place-items-center">
              {/* rotating hairline ring */}
              <motion.span
                aria-hidden
                className="absolute h-[190px] w-[190px] rounded-full border border-hairline-strong sm:h-[260px] sm:w-[260px]"
                initial={{ rotate: 0, scale: 0.9, opacity: 0 }}
                animate={{ rotate: 360, scale: 1, opacity: 1 }}
                transition={{
                  rotate: { duration: 8, ease: 'linear', repeat: Infinity },
                  scale: { duration: 1.2, ease: EASE_OUT },
                  opacity: { duration: 0.8 },
                }}
                style={{ borderTopColor: 'rgba(255,255,255,0.55)' }}
              />
              {/* progress arc ring, drawn with conic mask feel via scaling dashes */}
              <span
                aria-hidden
                className="absolute h-[150px] w-[150px] rounded-full border border-white/[0.06] sm:h-[210px] sm:w-[210px]"
              />

              {/* masked contour mark */}
              <motion.div
                className="relative h-[150px] w-[150px] overflow-hidden sm:h-[210px] sm:w-[210px]"
                initial={{ clipPath: 'inset(50% 0% 50% 0%)', scale: 1.08 }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
                transition={{ duration: 1.4, ease: EASE }}
              >
                <img
                  src={mark.url}
                  alt="ARCWELL contour mark"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </motion.div>

              {/* scan line sweeping the mark */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute h-px w-[150px] bg-gradient-to-r from-transparent via-white/70 to-transparent sm:w-[210px]"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: [-80, 80, -80], opacity: [0, 1, 0] }}
                transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
              />
            </div>

            {/* wordmark */}
            <motion.div
              className="mt-10 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.p
                className="font-display text-[26px] font-bold tracking-[0.2em] text-ink sm:text-[34px]"
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 0.4, duration: 1, ease: EASE }}
              >
                ARCWELL®
              </motion.p>
            </motion.div>

            <motion.p
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.32em] text-faint sm:text-[11px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Transaction-proof infrastructure
            </motion.p>

            {/* progress line + counter */}
            <div className="mt-10 flex w-[220px] items-center gap-4 sm:w-[280px]">
              <div className="relative h-px flex-1 bg-hairline-strong">
                <span
                  className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="tabular font-mono text-[11px] tracking-[0.18em] text-ink-muted">
                {String(progress).padStart(3, '0')}
              </span>
            </div>
          </motion.div>

          {/* corner registration marks */}
          <div className="pointer-events-none absolute inset-0 z-10">
            {[
              'left-5 top-5 border-l border-t',
              'right-5 top-5 border-r border-t',
              'left-5 bottom-5 border-b border-l',
              'right-5 bottom-5 border-b border-r',
            ].map((pos, i) => (
              <motion.span
                key={pos}
                aria-hidden
                className={`absolute h-5 w-5 border-hairline-strong sm:h-8 sm:w-8 ${pos}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={exiting ? { opacity: 0 } : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: EASE_OUT }}
              />
            ))}
          </div>
    </motion.div>
  )
}

