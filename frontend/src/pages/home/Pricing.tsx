import MaskLines from '@/components/MaskLines'
import PillButton from '@/components/PillButton'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'
import DataModelTimeline from '@/pages/home/DataModelTimeline'

/** §9, [08] Data model: the six proof entities, as a scroll-synced spine timeline. */
export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="flex flex-col items-center text-center">
          <SectionKicker index="08" label="Data model" align="center" />
          <MaskLines
            lines={['What ARCWELL records']}
              as="h2"
            className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
          />
          <Reveal className="mt-6">
            <p className="max-w-2xl text-base leading-relaxed text-ink-muted">
              Six entities, one job: turn transaction evidence into tamper-evident onchain records that
              authorized parties can verify. Nothing else is issued, traded, or settled here.
            </p>
          </Reveal>
        </div>

        <DataModelTimeline />


        <Reveal className="mt-10">
          <div className="flex flex-col items-start gap-6 rounded-[20px] border border-hairline bg-surface p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="font-display text-xl font-semibold text-ink">See the entities working end to end.</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                The dashboard walks every entity with live sample records, verifier findings, and correction trails.
              </p>
            </div>
            <PillButton to="/dashboard" variant="outline">
              Open the dashboard
            </PillButton>
          </div>
        </Reveal>

        <Reveal className="mt-8">
          <p className="text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-faint">
            Proof infrastructure only. ARCWELL does not execute, broker, custody, or settle transactions.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
