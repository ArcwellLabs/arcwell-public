import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/anim'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  start?: string
}

/** Default scroll reveal: y 48px -> 0, opacity 0 -> 1, 0.9s power3.out at 'top 85%'. */
export default function Reveal({ children, className, delay = 0, y = 48, start = 'top 85%' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          delay,
          scrollTrigger: { trigger: el, start, once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [delay, y, start])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
