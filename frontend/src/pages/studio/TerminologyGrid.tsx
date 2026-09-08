import { ArrowRight } from 'lucide-react'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const TERMS: Array<{ avoid: string; use: string }> = [
  { avoid: 'securities issuance', use: 'transaction recording / record submission' },
  { avoid: 'security token', use: 'transaction record / attested record' },
  { avoid: 'issuer', use: 'submitting organization / record originator' },
  { avoid: 'investor', use: 'authorized participant / record subject / viewer' },
  { avoid: 'SecuritySeries', use: 'RecordSeries / dataset / case file' },
  { avoid: 'securities marketplace', use: 'record explorer / verification workspace' },
  { avoid: 'offering', use: 'record set / disclosure package' },
  { avoid: 'buy / sell / subscribe', use: 'view / submit / verify / attest' },
  { avoid: 'trade', use: 'underlying transaction / recorded event' },
  { avoid: 'settlement', use: 'record finalization / proof anchoring' },
  { avoid: 'portfolio', use: 'record history / verification dashboard' },
  { avoid: 'compliant', use: 'compliance-supporting / rule-aware' },
]

/** §5, [05] Terminology discipline: every legacy market term mapped to ARCWELL language. */
export default function TerminologyGrid() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionKicker index="05" label="Terminology" />
              <MaskLines
                lines={['Words carry weight.', 'We choose ours.']}
                className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
              />
              <Reveal delay={0.15}>
                <p className="mt-8 max-w-sm text-base leading-relaxed text-ink-muted">
                  Capital-markets vocabulary implies capabilities ARCWELL does not have. Across product, API, and
                  documentation, legacy terms are replaced with language that describes exactly what the software does , recordkeeping and verification support, nothing more.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-hairline">
              <div className="grid grid-cols-[1fr_auto_1.4fr] items-center gap-3 border-b border-hairline bg-surface-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint md:px-6">
                <span>Instead of</span>
                <span aria-hidden />
                <span>ARCWELL says</span>
              </div>
              {TERMS.map((t, i) => (
                <Reveal key={t.avoid} delay={Math.min(i * 0.04, 0.3)} y={24}>
                  <div className="grid grid-cols-[1fr_auto_1.4fr] items-center gap-3 border-b border-hairline bg-surface px-5 py-4 last:border-b-0 md:px-6">
                    <span className="font-mono text-xs leading-relaxed text-faint line-through decoration-faint/60 md:text-[13px]">
                      {t.avoid}
                    </span>
                    <ArrowRight size={13} className="shrink-0 text-faint" aria-hidden />
                    <span className="font-mono text-xs leading-relaxed text-ink md:text-[13px]">{t.use}</span>
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
