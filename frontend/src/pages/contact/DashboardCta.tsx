import { ArrowRight } from 'lucide-react'
import MaskLines from '@/components/MaskLines'
import PillButton from '@/components/PillButton'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

/** §4, [04] Dashboard call-to-action: straight into the live control room. */
export default function DashboardCta() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <Reveal className="flex flex-col items-center text-center">
          <SectionKicker index="04" label="Live preview" align="center" />
          <MaskLines
            lines={['See it working.']}
            className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-ink"
          />
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
            The dashboard walks the full proof flow with sample organizations, record series,
            anchored transactions, verifier findings, and correction trails.
          </p>
          <PillButton to="/dashboard" className="mt-10">
            <span className="inline-flex items-center gap-2">
              Open the dashboard <ArrowRight size={15} />
            </span>
          </PillButton>
        </Reveal>
      </div>
    </section>
  )
}
