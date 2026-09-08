import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/anim'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const PRINCIPLES = [
  {
    n: '01',
    title: 'Proof, not trust',
    body: 'Every claim in the explorer links to an anchored artifact, a hash, a timestamp, a signature. If it cannot be pointed to, it is not stated.',
  },
  {
    n: '02',
    title: 'Append-only by default',
    body: 'Corrections are added to the record, never written over it. The original entry and every amendment stay visible, linked, and timestamped.',
  },
  {
    n: '03',
    title: 'Source on every field',
    body: 'Each data point carries attribution, which system reported it, when, and under whose signature. Unattributed data does not ship.',
  },
  {
    n: '04',
    title: 'Independent verification',
    body: 'Verifiers are structurally separate from submitting organizations, with reputation, challenge, and appeal history in the open.',
  },
  {
    n: '05',
    title: 'Bounded by design',
    body: 'ARCWELL records what external systems report. Validity, legality, and classification of the underlying event remain with the parties and their advisers.',
  },
]

/** §7, [07] Audit philosophy 01-05: sticky left rail, ghost numbers fill on viewport center. */
export default function AuditPhilosophy() {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const blocks = Array.from(list.querySelectorAll<HTMLElement>('[data-approach-block]'))
    if (prefersReducedMotion()) {
      blocks.forEach((block) => {
        gsap.set(block.querySelector('[data-ghost]'), { color: '#EDEDEA' })
        gsap.set(block.querySelector('[data-approach-title]'), { color: '#EDEDEA' })
      })
      return
    }
    const triggers = blocks.map((block) => {
      const ghost = block.querySelector('[data-ghost]')
      const title = block.querySelector('[data-approach-title]')
      return ScrollTrigger.create({
        trigger: block,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          gsap.to(ghost, { color: self.isActive ? '#EDEDEA' : 'transparent', duration: 0.5, overwrite: 'auto' })
          gsap.to(title, { color: self.isActive ? '#EDEDEA' : '#8B8B93', duration: 0.5, overwrite: 'auto' })
        },
      })
    })
    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="grid grid-cols-12 gap-10">
          {/* Sticky left rail */}
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionKicker index="07" label="Audit philosophy" />
              <h2 className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink">
                How we think about proof.
              </h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-muted">
                Five principles that hold whether a series has ten records or ten thousand.
              </p>
            </div>
          </div>

          {/* Numbered blocks */}
          <div ref={listRef} className="col-span-12 lg:col-span-7">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.08}>
                <div data-approach-block className="relative border-t border-hairline py-10 md:py-12">
                  <span
                    data-ghost
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-6 select-none font-display text-[120px] font-bold leading-none"
                    style={{ WebkitTextStroke: '1px rgba(255,255,255,0.15)', color: 'transparent' }}
                  >
                    {p.n}
                  </span>
                  <h3
                    data-approach-title
                    className="max-w-[80%] font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink-muted"
                  >
                    {p.n}, {p.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-hairline" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
