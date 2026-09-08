import { Anchor, History, ShieldCheck } from 'lucide-react'
import Counter from '@/components/Counter'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const STATS = [
  { value: 128, suffix: 'k+', label: 'Anchors submitted on ARC' },
  { value: 96, suffix: 'k+', label: 'Records verified' },
  { value: 340, suffix: '', label: 'Organizations anchoring' },
  { value: 98.6, suffix: '%', decimals: 1, label: 'Verifier accuracy' },
]

const BLURBS = [
  { icon: Anchor, title: 'Anchored on ARC', body: 'Every record carries an evidence hash, timestamp, and submitter signature.' },
  { icon: ShieldCheck, title: 'Independently verified', body: 'Verifiers compare evidence and flag discrepancies for structured review.' },
  { icon: History, title: 'Append-only history', body: 'Corrections extend the trail, original entries are never rewritten.' },
]

/** §6, [05] Metrics band: proof counters, dividers, capability blurbs. */
export default function Metrics() {
  return (
    <section className="border-y border-hairline bg-surface">
      <div className="container-infini py-[clamp(80px,9vw,120px)]">
        <SectionKicker index="05" label="Network activity" />
        <MaskLines
          lines={['We do not move assets.', 'We move evidence into the open.']}
              as="h2"
          className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-ink [&>span:last-child>span]:text-faint"
        />

        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`py-6 lg:py-0 ${i > 0 ? 'lg:border-l lg:border-hairline lg:pl-8' : ''} ${
                i % 2 === 1 ? 'border-l border-hairline pl-6 lg:pl-8' : ''
              }`}
            >
              <p className="font-mono text-[clamp(40px,4.6vw,84px)] font-medium leading-none text-ink">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix ?? ''}
                  decimals={stat.decimals ?? 0}
                />
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BLURBS.map((blurb, i) => (
            <Reveal key={blurb.title} delay={i * 0.15}>
              <div className="h-full rounded-[20px] border border-hairline bg-bg p-7 transition-colors duration-300 hover:border-hairline-strong">
                <blurb.icon size={22} className="text-ink" aria-hidden />
                <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{blurb.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{blurb.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
