import { Check, X } from 'lucide-react'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const DOES = [
  'Anchor transaction hashes and timestamps on ARC.',
  'Link records to supporting documents and source references.',
  'Preserve an append-only audit and correction history.',
  'Let authorized users submit and attest to records.',
  'Let verifiers review evidence and flag discrepancies.',
  'Provide read-only APIs and a public record explorer.',
  'Surface third-party rule or screening results with source and time.',
  'Reward objectively valid data-quality work, subject to separate review.',
]

const DOES_NOT = [
  'Create or issue securities; offer, promote, or sell securities; match buyers and sellers.',
  'Transfer ownership of an underlying instrument; hold customer assets or act as custodian.',
  'Route investment payments or perform delivery-versus-payment settlement.',
  'Certify Reg D, Reg S, Reg CF, accreditation, sanctions, KYC approval, or legal compliance.',
  'Provide investment advice or guarantee transaction validity.',
]

/** §4, [04] The boundary, enforced: two-column ARCWELL does / does-not ledger. */
export default function DoesDoesNot() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="04" label="Scope" />
        <MaskLines
          lines={['The boundary, enforced.']}
          className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
        />
        <Reveal delay={0.15}>
          <p className="mt-8 max-w-2xl text-base leading-[1.65] text-ink-muted">
            Every screen, API field, and reward rule in ARCWELL is checked against this list. If a capability is not in
            the left column, it is out of scope, deliberately.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-hairline bg-surface p-6 md:p-10">
              <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                ARCWELL does
              </p>
              <ul className="mt-8 space-y-0">
                {DOES.map((item) => (
                  <li key={item} className="flex items-start gap-4 border-t border-hairline py-4 first:border-t-0 first:pt-0">
                    <Check size={16} className="mt-1 shrink-0 text-accent" aria-hidden />
                    <span className="text-base leading-relaxed text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="h-full rounded-2xl border border-hairline bg-surface p-6 md:p-10">
              <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-faint" />
                ARCWELL does not
              </p>
              <ul className="mt-8 space-y-0">
                {DOES_NOT.map((item) => (
                  <li key={item} className="flex items-start gap-4 border-t border-hairline py-4 first:border-t-0 first:pt-0">
                    <X size={16} className="mt-1 shrink-0 text-faint" aria-hidden />
                    <span className="text-base leading-relaxed text-ink-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
