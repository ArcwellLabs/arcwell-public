import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, FileCheck2, GitBranch } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const FEATURED_NOTE =
  'ARCWELL gave our reporting a single tamper-evident trail, every record we submit is anchored on ARC and independently checkable.'

const MINI_METRICS = [
  { value: '98.6%', label: 'Verifier accuracy' },
  { value: '~4 s', label: 'Anchor confirmation' },
  { value: '0', label: 'Silent edits, ever' },
]

const NOTES: Array<{ icon: LucideIcon; quote: string; author: string; role: string }> = [
  {
    icon: BadgeCheck,
    quote: '"Discrepancy flags arrive with evidence attached, review takes minutes, not weeks."',
    author: 'Compliance desk',
    role: 'Terra record set',
  },
  {
    icon: GitBranch,
    quote: '"The correction trail reads like a ledger: append-only, timestamped, complete."',
    author: 'Operations team',
    role: 'Northbound series',
  },
  {
    icon: FileCheck2,
    quote: '"The read-only API plugged straight into our existing audit reporting."',
    author: 'Data team',
    role: 'Atlas workspace',
  },
]

/** §10, [09] Validation notes: featured scrub note, mini metrics, abstract-seal note cards. */
export default function Testimonials() {
  const quoteRef = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    const el = quoteRef.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-tword]'),
        { opacity: 0.15 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 30%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="09" label="Validation notes" />
        <h2 className="sr-only">Validation notes — what operators verify</h2>

        <blockquote
          ref={quoteRef}
          className="mt-12 max-w-4xl font-display text-[clamp(24px,3vw,40px)] font-medium leading-[1.3] text-ink"
        >
          {FEATURED_NOTE.split(' ').map((word, i) => (
            <span key={i}>
              <span data-tword className="inline-block">
                {word}
              </span>{' '}
            </span>
          ))}
        </blockquote>

        <Reveal className="mt-10">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline-strong bg-surface">
              <BadgeCheck size={20} className="text-accent" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Reporting operations</p>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
                Helix dataset, submitting organization
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 border-y border-hairline py-8 sm:grid-cols-3">
          {MINI_METRICS.map((m) => (
            <div key={m.label} className="text-center sm:text-left">
              <p className="font-mono text-3xl text-ink sm:text-4xl">{m.value}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {NOTES.map((note, i) => (
            <Reveal key={note.role} delay={i * 0.12}>
              <figure className="flex h-full flex-col rounded-[20px] border border-hairline bg-surface p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-hairline-strong">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong bg-bg">
                  <note.icon size={18} className="text-ink" aria-hidden />
                </span>
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-ink">{note.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{note.author}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">{note.role}</p>
                  </div>
                </figcaption>
                <Link
                  to="/projects"
                  className="group mt-6 inline-flex min-h-[44px] items-center gap-2 border-t border-hairline pt-4 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
                >
                  Open record series
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
