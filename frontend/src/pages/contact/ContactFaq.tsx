import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { comingSoon } from '@/lib/comingSoon'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const ITEMS = [
  {
    q: 'What does an ARC anchor actually prove?',
    a: 'That specified data was submitted at a given time and has not been altered since. It does not by itself prove the underlying transaction was lawful, valid, authorized, or correctly classified, ARCWELL is proof-only infrastructure, and we label that boundary everywhere.',
  },
  {
    q: 'Where is our evidence stored?',
    a: 'Source files live in encrypted or permissioned storage with content-addressed references, retention rules, and access logs. Only hashes, timestamps, signatures, and your chosen metadata touch ARC, under the visibility policy you set per record set.',
  },
  {
    q: 'Who verifies the records, and how are rewards handled?',
    a: 'Independent verifiers review disclosed records, compare evidence, and flag inconsistencies. Rewards pay for objectively valid data-quality work under published eligibility rules, with anti-collusion controls and a separate review before anything is paid.',
  },
  {
    q: 'What happens when a record is wrong?',
    a: 'Nothing is edited or deleted. A correction entry is appended and linked to the original, so the explorer shows the full trail: original record, verifier flags, corrections, and current status. The history stays auditable end to end.',
  },
  {
    q: 'Does ARCWELL certify compliance or handle our obligations?',
    a: 'No. ARCWELL can surface third-party rule or screening results with source and time, but it does not certify KYC, accreditation, sanctions, or legal compliance, and it does not replace your legal, regulatory, or recordkeeping obligations.',
  },
  {
    q: 'What does a pilot include?',
    a: 'A scoped record series, evidence packaging, anchoring on ARC, read-only explorer and API access for your team, and verifier coverage sized to your record volume. Most pilots anchor their first records within days of the scoping call.',
  },
]

/** §6, [06] FAQ: sticky intro + email mini-card, single-open accordion. */
export default function ContactFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          {/* Sticky intro */}
          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <SectionKicker index="06" label="FAQ" />
            <MaskLines
              lines={['Before you ask.']}
              className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-ink"
            />
            <Reveal className="mt-8">
              <p className="max-w-md text-base leading-relaxed text-ink-muted">
                The questions every operations and recordkeeping team asks before a pilot,
                answered straight.
              </p>
              <div className="mt-8 rounded-[20px] border border-hairline bg-surface p-6">
                <p className="kicker">Prefer socials?</p>
                <button
                  type="button"
                  onClick={() => comingSoon('X')}
                  className="group mt-3 inline-flex min-h-[44px] items-center gap-2 text-lg font-medium text-ink"
                >
                  <Twitter
                    size={18}
                    className="text-faint transition-colors duration-300 group-hover:text-ink"
                    aria-hidden
                  />
                  Follow on X
                </button>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Product notes and network status. Channel opens shortly.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Accordion */}
          <div>
            {ITEMS.map((item, i) => {
              const isOpen = open === i
              return (
                <Reveal key={item.q} delay={i * 0.08} y={24}>
                  <div className="border-b border-hairline first:border-t">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span
                        className={cn(
                          'text-lg font-medium transition-colors duration-300 md:text-xl',
                          isOpen ? 'text-ink' : 'text-ink-muted hover:text-ink',
                        )}
                      >
                        {item.q}
                      </span>
                      <Plus
                        size={20}
                        aria-hidden
                        className={cn(
                          'shrink-0 transition-transform duration-300',
                          isOpen ? 'rotate-45 text-ink' : 'text-faint',
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-lg pb-7 text-base leading-relaxed text-ink-muted">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
