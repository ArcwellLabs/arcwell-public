import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/anim'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const STEPS = [
  { index: '01', title: 'Submit record', body: 'An authorized organization submits a transaction record with its external reference and event type.' },
  { index: '02', title: 'Package evidence', body: 'Supporting documents are bundled, content-addressed, and linked to the record with signatures.' },
  { index: '03', title: 'Anchor on ARC', body: 'The evidence hash, timestamp, and submitter signature are anchored on ARC, tamper-evident from that moment.' },
  { index: '04', title: 'Verify independently', body: 'Verifiers compare disclosed evidence, file structured findings, and flag discrepancies.' },
  { index: '05', title: 'Correct transparently', body: 'Corrections append to the record with their own anchor. The original entry is never rewritten.' },
]

const FACTS = [
  ['Anchor confirmation', '~4 s'],
  ['History', 'Append-only'],
  ['Verifier rewards', 'Objective rules'],
]

/** §8, [07] Horizontally scrollable process rail with progress track. */
export default function Process() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const pin = pinRef.current
    const rail = railRef.current
    if (!pin || !rail) return
    if (prefersReducedMotion()) return

    const updateProgress = () => {
      const max = Math.max(1, pin.scrollWidth - pin.clientWidth)
      const progress = Math.min(1, pin.scrollLeft / max)
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`
      if (counterRef.current) counterRef.current.textContent = `0${Math.min(5, Math.round(progress * 4) + 1)}`
    }
    pin.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return () => pin.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <section ref={sectionRef} id="process" className="border-t border-hairline">
      <div className="container-infini pt-[clamp(96px,12vw,200px)]">
        <SectionKicker index="07" label="Process" />
        <div className="mt-8 grid grid-cols-12 gap-10">
          <MaskLines
            lines={['From submitted record', 'to anchored proof.']}
              as="h2"
            className="col-span-12 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-ink lg:col-span-8"
          />
          <Reveal className="col-span-12 lg:col-span-4 lg:pt-4">
            <dl className="space-y-4">
              {FACTS.map(([term, value]) => (
                <div key={term} className="flex items-baseline justify-between border-b border-hairline pb-3">
                  <dt className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">{term}</dt>
                  <dd className="font-mono text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>

      {/* Native horizontal rail avoids third-party DOM reparenting during route changes. */}
      <div ref={pinRef} className="relative mt-10 overflow-x-auto overscroll-x-contain py-10 md:py-16">
        <div ref={railRef} className="flex w-max gap-6 pl-6 will-change-transform md:pl-12 xl:pl-20">
          {STEPS.map((step) => (
            <article
              key={step.index}
              data-process-card
              className="relative flex h-[380px] w-[420px] max-w-[86vw] shrink-0 flex-col justify-between overflow-hidden rounded-[20px] border border-hairline bg-surface p-6 sm:p-8"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-8 font-display text-[120px] font-bold leading-none text-faint/30"
              >
                {step.index}
              </span>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">( {step.index} )</p>
              <div>
                <h3 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{step.title}</h3>
                <p className="mt-4 max-w-xs text-base leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Progress */}
        <div className="container-infini sticky left-0 mt-12 flex items-center gap-6">
          <div className="relative h-px flex-1 bg-hairline">
            <div
              ref={fillRef}
              className="absolute inset-0 origin-left scale-x-0 bg-accent"
              aria-hidden
            />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            <span ref={counterRef} className="text-ink">01</span>, 05
          </p>
        </div>
      </div>
    </section>
  )
}
