import { useEffect, useRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import SectionKicker from '@/components/SectionKicker'

/** §1, [01] Hero: masked 2-line H1 + operating-boundary statement card sliding in from the right. */
export default function Hero() {
  const rootRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const card = cardRef.current
    if (!root) return
    const lines = root.querySelectorAll<HTMLElement>('[data-hero-line]')
    if (prefersReducedMotion()) {
      gsap.set(lines, { yPercent: 0 })
      if (card) gsap.set(card, { x: 0, opacity: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.12, delay: 0.1 },
      )
      if (card) {
        gsap.fromTo(card, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.5 })
      }
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="container-infini pt-[clamp(120px,16vw,200px)]">
      <div className="grid grid-cols-12 items-end gap-10">
        <div className="col-span-12 lg:col-span-8">
          <SectionKicker index="01" label="Verification pilot" />
          <h1 className="mt-10 font-display text-[clamp(48px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden">
              <span data-hero-line className="block will-change-transform">
                Start a verification
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-hero-line className="block will-change-transform">
                pilot <span className="text-faint">on ARC.</span>
              </span>
            </span>
          </h1>
        </div>

        {/* Operating-boundary statement card, abstract seal, no portrait */}
        <figure
          ref={cardRef}
          className="col-span-12 rounded-[20px] border border-hairline bg-surface p-6 lg:col-span-4"
        >
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline-strong bg-surface-2"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(214,255,75,0.18),transparent_60%)]" />
              <ShieldCheck size={20} className="text-ink" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
              Operating boundary, ARCWELL
            </span>
          </div>
          <blockquote className="mt-5 text-base leading-relaxed text-ink">
            &ldquo;We record what external systems report, we do not execute the transaction. Tell us
            what you need to prove, and we&apos;ll scope a pilot around it.&rdquo;
          </blockquote>
        </figure>
      </div>
    </section>
  )
}
