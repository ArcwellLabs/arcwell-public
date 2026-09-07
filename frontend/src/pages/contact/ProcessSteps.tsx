import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import SectionKicker from '@/components/SectionKicker'
import Reveal from '@/components/Reveal'

const STEPS = [
  {
    n: '01',
    title: 'Describe your records',
    body: 'Send the form or book a call. Tell us the use case, record volume, and visibility policy, takes two minutes.',
  },
  {
    n: '02',
    title: 'Pilot scoping call',
    body: '30 minutes with the protocol team: evidence packaging, anchor cadence, and verifier coverage for your record set.',
  },
  {
    n: '03',
    title: 'First anchors within days',
    body: 'Pilot workspace live, first records anchored on ARC, and read-only explorer access for your team.',
  },
]

/** §3, [03] Process: sticky intro column + numbered rows whose ghost numbers fill on scroll. */
export default function ProcessSteps() {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-step-row]'))
    const ghosts = Array.from(list.querySelectorAll<HTMLElement>('[data-ghost]'))
    if (prefersReducedMotion()) {
      gsap.set(rows, { x: 0, opacity: 1 })
      gsap.set(ghosts, { color: '#EDEDEA' })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rows,
        { x: -48, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: list, start: 'top 85%', once: true },
        },
      )
      rows.forEach((row, i) => {
        const ghost = ghosts[i]
        if (!ghost) return
        gsap.to(ghost, {
          color: '#EDEDEA',
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: row, start: 'top center', toggleActions: 'play none none reverse' },
        })
      })
    }, list)
    return () => ctx.revert()
  }, [])

  return (
    <section className="container-infini py-[clamp(96px,12vw,200px)]">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
        <div className="lg:sticky lg:top-[120px] lg:self-start">
          <SectionKicker index="03" label="Pilot process" />
          <Reveal className="mt-8">
            <h2 className="font-display text-[clamp(28px,3vw,44px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              From first note to first anchor.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
              No mystery, no six-week procurement maze. Three steps between you and a live
              verification pilot on ARC.
            </p>
          </Reveal>
        </div>

        <div ref={listRef}>
          {STEPS.map((step) => (
            <div
              key={step.n}
              data-step-row
              className="flex items-start gap-8 border-b border-hairline py-10 first:border-t"
            >
              <span
                data-ghost
                aria-hidden
                className="font-display text-[clamp(48px,5vw,80px)] font-bold leading-none tracking-[-0.03em]"
                style={{ color: '#232329' }}
              >
                {step.n}
              </span>
              <div className="pt-2">
                <h3 className="font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
