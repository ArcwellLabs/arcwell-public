import { useEffect, useRef } from 'react'
import { Quote } from 'lucide-react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const QUOTE_LINES = [
  '"We record what external systems',
  'report, we do not execute',
  'the transaction."',
]

const PILLARS = [
  { index: '01', title: 'Anchor', body: 'Hashes, timestamps, and submitter signatures anchored on ARC.' },
  { index: '02', title: 'Verify', body: 'Independent verifiers review evidence and flag discrepancies.' },
  { index: '03', title: 'Correct', body: 'Corrections append to the record, nothing is silently rewritten.' },
]

/** §4, [03] Operating-boundary statement card (abstract visual, no human) + three proof pillars. */
export default function Founder() {
  const visualRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      if (visualRef.current) {
        gsap.fromTo(
          visualRef.current.querySelector('img'),
          { clipPath: 'inset(100% 0 0 0)' },
          {
            clipPath: 'inset(0% 0 0 0)',
            duration: 1,
            ease: 'power4.out',
            scrollTrigger: { trigger: visualRef.current, start: 'top 80%', once: true },
          },
        )
      }
      if (quoteRef.current) {
        gsap.fromTo(
          quoteRef.current.querySelectorAll('[data-quote-line]'),
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1,
            ease: 'power4.out',
            stagger: 0.1,
            scrollTrigger: { trigger: quoteRef.current, start: 'top 80%', once: true },
          },
        )
      }
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="03" label="Operating boundary" />
        <h2 className="sr-only">Operating boundary — what ARCWELL does and does not do</h2>
        <div className="mt-14 grid grid-cols-12 gap-10">
          {/* Abstract proof card */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4">
            <div ref={visualRef} className="overflow-hidden rounded-2xl border border-hairline">
              <img
                src="/art-03.png"
                alt="Abstract chrome evidence seal forming a perfect sphere"
                className="aspect-[4/5] w-full object-cover grayscale"
              />
            </div>
            <div className="mt-6 flex items-start justify-between">
              <div>
                <h3 className="font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
                  Proof, not execution
                </h3>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                  The ARCWELL product boundary
                </p>
              </div>
              <Quote size={22} className="mt-1 text-faint" aria-hidden />
            </div>
          </div>

          {/* Quote + pillars */}
          <div className="col-span-12 md:col-span-7 lg:col-span-8">
            <blockquote
              ref={quoteRef}
              className="font-display text-[clamp(24px,2.8vw,40px)] font-medium leading-[1.25] tracking-[-0.01em] text-ink"
            >
              {QUOTE_LINES.map((line) => (
                <span key={line} className="block overflow-hidden">
                  <span data-quote-line className="block will-change-transform">
                    {line}
                  </span>
                </span>
              ))}
            </blockquote>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {PILLARS.map((pillar, i) => (
                <Reveal key={pillar.index} delay={i * 0.12} start="top 80%">
                  <div className="border-l border-hairline pl-5">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
                      {pillar.index} / {pillar.title}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">{pillar.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
