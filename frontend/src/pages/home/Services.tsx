import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '@/lib/anim'
import Chip from '@/components/Chip'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const CAPABILITIES = [
  {
    index: '01',
    title: 'Onchain Registry',
    body: 'Record identifiers, evidence hashes, timestamps, signatures, and verification outcomes on ARC.',
    chips: ['Evidence hashes', 'Timestamps', 'Signatures'],
    img: '/svc-dev.png',
  },
  {
    index: '02',
    title: 'Evidence Storage',
    body: 'Permissioned source files with content-addressed references, retention rules, and access logs.',
    chips: ['Content-addressed', 'Retention', 'Access logs'],
    img: '/svc-product.png',
  },
  {
    index: '03',
    title: 'Organization Portal',
    body: 'Submit records, package evidence, set visibility policies, track status, and file corrections.',
    chips: ['Submission', 'Visibility', 'Corrections'],
    img: '/svc-digital.png',
  },
  {
    index: '04',
    title: 'Public Explorer',
    body: 'Searchable record metadata, provenance, timestamps, and verification history, with clear source labels.',
    chips: ['Search', 'Provenance', 'Source labels'],
    img: '/svc-growth.png',
  },
  {
    index: '05',
    title: 'Verifier Workspace',
    body: 'Evidence comparison, structured findings, challenge submission, reputation, and appeal history.',
    chips: ['Findings', 'Challenges', 'Reputation'],
    img: '/svc-brand.png',
  },
  {
    index: '06',
    title: 'Data Services',
    body: 'Read-only APIs, webhooks, and exportable audit reports with full source attribution.',
    chips: ['Read-only API', 'Webhooks', 'Audit exports'],
    img: '/art-02.png',
  },
]

/** §7, [06] Capabilities: sticky left rail + scrolling capability panels, active index tracking. */
export default function Services() {
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const panels = Array.from(list.querySelectorAll('[data-service-panel]'))
    const triggers = panels.map((panel, i) =>
      ScrollTrigger.create({
        trigger: panel,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <section>
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          {/* Sticky rail */}
          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <SectionKicker index="06" label="Capabilities" />
            <MaskLines
              lines={['Six layers of', 'proof infrastructure.']}
              as="h2"
              className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-ink"
            />
            <Reveal className="mt-8">
              <p className="max-w-md text-xl leading-[1.6] text-ink-muted">
                Every layer records and verifies, none of them execute the transaction.
              </p>
            </Reveal>
            <p className="mt-12 font-mono text-4xl text-faint" aria-live="polite">
              <span className="text-ink">{CAPABILITIES[active].index}</span> / 06
            </p>
          </div>

          {/* Panels */}
          <div ref={listRef} className="flex flex-col gap-6">
            {CAPABILITIES.map((svc) => (
              <Reveal key={svc.index} y={80}>
                <article
                  data-service-panel
                  className="group min-h-[60vh] overflow-hidden rounded-[20px] border border-hairline bg-surface transition-colors duration-500 hover:border-hairline-strong lg:min-h-[70vh]"
                >
                  <div className="overflow-hidden">
                    <img
                      src={svc.img}
                      alt={svc.title}
                      loading="lazy"
                      className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">({svc.index})</p>
                    <h3 className="mt-3 font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
                      {svc.title}
                    </h3>
                    <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">{svc.body}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {svc.chips.map((chip) => (
                        <Chip key={chip} className="group-hover:border-hairline-strong">
                          {chip}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
