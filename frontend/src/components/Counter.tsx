import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/anim'
import { cn } from '@/lib/utils'

interface CounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

/** GSAP ticker counter: tweens 0 -> value on scroll into view, mono tabular numerals. */
export default function Counter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fmt = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`
    if (prefersReducedMotion()) {
      el.textContent = fmt(value)
      return
    }
    el.textContent = fmt(0)
    const state = { v: 0 }
    const tween = gsap.to(state, {
      v: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = fmt(state.v)
      },
      paused: true,
    })
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => tween.play(),
    })
    return () => {
      trigger.kill()
      tween.kill()
    }
  }, [value, prefix, suffix, decimals, duration])

  return <span ref={ref} className={cn('tabular', className)} />
}
