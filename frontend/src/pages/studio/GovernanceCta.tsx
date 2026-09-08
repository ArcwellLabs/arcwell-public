import { FileText, Scale, ShieldCheck } from 'lucide-react'
import Magnetic from '@/components/Magnetic'
import MaskLines from '@/components/MaskLines'
import PillButton from '@/components/PillButton'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const GOVERNANCE = [
  {
    icon: ShieldCheck,
    title: 'Protocol rules',
    body: 'Anchor formats, hash schemes, and correction-link semantics are versioned and published. Changes ship with notice and migration notes.',
  },
  {
    icon: Scale,
    title: 'Verifier rules',
    body: 'Eligibility, structured-finding formats, challenge windows, and appeal paths are objective and public. Reputation is earned on the record.',
  },
  {
    icon: FileText,
    title: 'Reward rules',
    body: 'Reward calculations are transparent and tied to objectively valid data-quality work, subject to anti-collusion controls and separate review.',
  },
]

/** §8, [08] Governance: protocol & verifier rules only, plus closing CTA. */
export default function GovernanceCta() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="08" label="Governance" />
        <MaskLines
          lines={['Governed where we operate,', 'silent where we do not.']}
          className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
        />
        <Reveal delay={0.15}>
          <p className="mt-8 max-w-2xl text-base leading-[1.65] text-ink-muted">
            ARCWELL governance covers the protocol, the verifier network, and the reward system. It never touches the
            legality, validity, or classification of an underlying transaction, those questions belong to the parties
            involved and their own advisers.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {GOVERNANCE.map((g, i) => (
            <Reveal key={g.title} delay={i * 0.12}>
              <div className="group h-full rounded-2xl border border-hairline bg-surface p-6 transition-colors duration-500 hover:border-hairline-strong md:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong text-ink transition-colors duration-500 group-hover:border-accent/60 group-hover:text-accent">
                  <g.icon size={18} aria-hidden />
                </span>
                <h3 className="mt-6 font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
                  {g.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{g.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-[clamp(64px,8vw,120px)] rounded-[20px] border border-hairline bg-surface px-6 py-14 text-center md:px-12 md:py-20">
            <p className="kicker">( Proof-only infrastructure )</p>
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(28px,4vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink">
              See the operating model in practice.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.65] text-ink-muted">
              Browse anchored RecordSeries in the public explorer, or bring your own records to a verification pilot.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Magnetic>
                <PillButton to="/projects">Open the record explorer</PillButton>
              </Magnetic>
              <Magnetic>
                <PillButton to="/contact" variant="outline">
                  Start a verification pilot
                </PillButton>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
