import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import MaskLines from '@/components/MaskLines'
import SectionKicker from '@/components/SectionKicker'

const LAYERS: Array<{ n: string; name: string; body: string }> = [
  {
    n: '01',
    name: 'Onchain registry',
    body: 'Record identifiers, evidence hashes, timestamps, submitter signatures, correction links, verification outcomes.',
  },
  {
    n: '02',
    name: 'Evidence storage',
    body: 'Encrypted or permissioned source files, content-addressed references, retention rules, access logs.',
  },
  {
    n: '03',
    name: 'Organization portal',
    body: 'Record submission, evidence packaging, visibility controls, status tracking, corrections.',
  },
  {
    n: '04',
    name: 'Public explorer',
    body: 'Searchable record metadata, provenance, timestamps, verification history, clear source labels.',
  },
  {
    n: '05',
    name: 'Verifier workspace',
    body: 'Evidence comparison, structured findings, challenge submission, reputation, appeal history.',
  },
  {
    n: '06',
    name: 'Data services',
    body: 'Read-only API, webhooks, exportable audit reports, source attribution, monitoring.',
  },
  {
    n: '07',
    name: 'Reward system',
    body: 'Objective eligibility rules, anti-collusion controls, transparent reward calculations, separate legal review.',
  },
]

/** §6, [06] Architecture: seven canonical layers, rows wipe in scrub-linked. */
export default function ArchitectureLayers() {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const rows = list.querySelectorAll('[data-layer-row]')
    if (prefersReducedMotion()) {
      gsap.set(rows, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rows,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: {
            trigger: list,
            start: 'top 80%',
            end: 'bottom 60%',
            scrub: true,
          },
        },
      )
    }, list)
    return () => ctx.revert()
  }, [])

  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="06" label="Architecture" />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <MaskLines
            lines={['Seven layers, one proof trail.']}
            className="font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
          />
          <p className="max-w-md text-base leading-[1.65] text-ink-muted">
            Each layer is independently deployable and independently auditable. Read paths are public where policy
            allows; write paths require authorization.
          </p>
        </div>

        <div ref={listRef} className="mt-14 border-b border-hairline">
          {LAYERS.map((layer) => (
            <div
              key={layer.n}
              data-layer-row
              className="grid grid-cols-1 gap-3 border-t border-hairline py-6 md:grid-cols-12 md:items-baseline md:py-8"
            >
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-faint md:col-span-2">
                [{layer.n}]
              </span>
              <h3 className="font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink md:col-span-4">
                {layer.name}
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted md:col-span-6 md:text-base">{layer.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
