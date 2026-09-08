import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { comingSoon } from '@/lib/comingSoon'
import MaskLines from '@/components/MaskLines'
import PillButton from '@/components/PillButton'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const ITEMS = [
  {
    q: 'What does an ARC anchor actually prove?',
    a: 'An anchor proves that specified data was submitted at a given time and has not been altered since. It does not by itself prove the underlying transaction was lawful, valid, authorized, or correctly classified.',
  },
  {
    q: 'Where is the evidence stored?',
    a: 'Source files live in encrypted, permissioned storage with content-addressed references, retention rules, and access logs. Only hashes, timestamps, and signatures are anchored on ARC.',
  },
  {
    q: 'How do verifier rewards work?',
    a: 'Verifiers earn rewards for objectively valid data-quality work under transparent calculations and anti-collusion controls, subject to separate review, never guaranteed.',
  },
  {
    q: 'Can a record be corrected?',
    a: 'Yes. Corrections are appended to the record with their own anchor and reason. The original entry is never rewritten or deleted, the full trail stays visible.',
  },
  {
    q: 'Does ARCWELL certify compliance?',
    a: 'No. Third-party rule or screening results are surfaced with their source and time, without legal certification. Your regulatory and recordkeeping obligations remain yours.',
  },
  {
    q: 'Is ARCWELL a marketplace or custodian?',
    a: 'No. ARCWELL never holds assets, routes payments, matches buyers and sellers, or executes transactions. It records and verifies evidence of transactions completed elsewhere.',
  },
]

/** §11, [10] FAQ: sticky intro column + single-open accordion. */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          {/* Sticky intro */}
          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <SectionKicker index="10" label="FAQ" />
            <MaskLines
              lines={['Proof, explained.']}
              as="h2"
              className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-ink"
            />
            <Reveal className="mt-8">
              <p className="max-w-md text-base leading-relaxed text-ink-muted">
                The boundary questions, up front. Anything else is a message away.
              </p>
              <div className="mt-8 rounded-[20px] border border-hairline bg-surface p-6">
                <p className="text-sm text-ink-muted">Still curious? Reach the team directly.</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <PillButton to="/contact" variant="outline">
                    Ask us anything
                  </PillButton>
                  <button
                    type="button"
                    onClick={() => comingSoon('X')}
                    aria-label="ARCWELL on X, coming soon"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-hairline-strong text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
                  >
                    <Twitter size={16} aria-hidden />
                  </button>
                </div>
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
                      className="flex min-h-[44px] w-full items-center justify-between gap-6 py-6 text-left"
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
