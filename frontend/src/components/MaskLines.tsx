import React, { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import { cn } from '@/lib/utils'

interface MaskLinesProps {
  lines: string[]
  /** Semantic element to render (e.g. 'h2' for section titles). Defaults to 'div'. */
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  lineClassName?: string
  delay?: number
  stagger?: number
  start?: string
}

/** Headline mask reveal: each line slides up inside an overflow-hidden wrapper. */
export default function MaskLines({
  lines,
  as: Tag = 'div',
  className,
  lineClassName,
  delay = 0,
  stagger = 0.1,
  start = 'top 85%',
}: MaskLinesProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const inners = el.querySelectorAll<HTMLElement>('[data-mask-line]')
    if (prefersReducedMotion()) {
      gsap.set(inners, { yPercent: 0 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inners,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1,
          ease: 'power4.out',
          stagger,
          delay,
          scrollTrigger: { trigger: el, start, once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [delay, stagger, start, lines])

  return (
    <Tag ref={ref as React.Ref<any>} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <span data-mask-line className={cn('block will-change-transform', lineClassName)}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}
