import Counter from '@/components/Counter'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const STATS = [
  { value: 48210, decimals: 0, suffix: '', label: 'Anchors submitted on ARC' },
  { value: 41773, decimals: 0, suffix: '', label: 'Records verified independently' },
  { value: 126, decimals: 0, suffix: '', label: 'Submitting organizations' },
  { value: 1.8, decimals: 1, suffix: 's', label: 'Median confirmation time' },
  { value: 98.2, decimals: 1, suffix: '%', label: 'Verifier accuracy (trailing 90 days)' },
]

/** §2, [02] Network metrics: animated mono counters across the grid. */
export default function StatsBar() {
  return (
    <section className="mt-[clamp(64px,9vw,140px)] border-t border-hairline">
      <div className="container-infini py-[clamp(64px,8vw,120px)]">
        <SectionKicker index="02" label="Network metrics" />
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-5">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="bg-surface">
              <div className="flex h-full flex-col justify-between gap-6 p-6 md:p-8">
                <p className="font-mono text-[clamp(28px,3vw,44px)] font-medium leading-none text-ink">
                  <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                </p>
                <p className="text-xs leading-relaxed text-ink-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
