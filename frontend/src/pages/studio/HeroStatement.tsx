import { motion } from 'framer-motion'
import Magnetic from '@/components/Magnetic'
import PillButton from '@/components/PillButton'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const ANCHOR_FEED = [
  { hash: '0x7f3a…012345', label: 'record anchored', time: '14:22:07Z' },
  { hash: '0x2b8e…c19375', label: 'evidence sealed', time: '08:41:53Z' },
  { hash: '0x9d04…e1f3a5', label: 'correction appended', time: '16:05:31Z' },
  { hash: '0x4f1a…a0c2e4', label: 'verifier finding filed', time: '11:37:44Z' },
  { hash: '0x0e6b…f3a5c7', label: 'record anchored', time: '05:52:18Z' },
]

/** §1, hero: operating-model statement + abstract anchor feed (no imagery, CSS only). */
export default function HeroStatement() {
  return (
    <section className="container-infini overflow-hidden pt-[120px] md:pt-[200px]">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        className="kicker"
      >
        [01] Operating model, ARCWELL on ARC
      </motion.p>

      <h1 className="mt-6 font-display text-[clamp(40px,6.4vw,104px)] font-bold leading-[0.98] tracking-[-0.03em]">
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
            className="block text-ink will-change-transform"
          >
            We record what external
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.25 }}
            className="block text-ink will-change-transform"
          >
            systems report , </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.35 }}
            className="block text-faint will-change-transform"
          >
            we do not execute
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.45 }}
            className="block text-faint will-change-transform"
          >
            the transaction.
          </motion.span>
        </span>
      </h1>

      <div className="mt-14 grid grid-cols-12 items-end gap-10">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
          className="col-span-12 max-w-xl text-base leading-[1.65] text-ink-muted md:text-lg lg:col-span-6"
        >
          ARCWELL turns transaction evidence into tamper-evident onchain records that authorized parties can verify.
          Anchor evidence on ARC, preserve an append-only audit trail, and let independent verifiers check what was
          submitted.
        </motion.p>

        {/* Abstract anchor feed panel, pure CSS/mono, no photography */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
          className="relative col-span-12 overflow-hidden rounded-2xl border border-hairline bg-surface lg:col-span-6"
          aria-hidden
        >
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">ARC · anchor feed</span>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Live
            </span>
          </div>
          <ul className="divide-y divide-hairline px-5">
            {ANCHOR_FEED.map((row) => (
              <li key={row.hash} className="flex items-center justify-between gap-4 py-3 font-mono text-xs">
                <span className="text-ink">{row.hash}</span>
                <span className="hidden text-ink-muted sm:block">{row.label}</span>
                <span className="shrink-0 text-faint tabular">{row.time}</span>
              </li>
            ))}
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.75 }}
        className="mt-12 flex flex-wrap gap-4"
      >
        <Magnetic>
          <PillButton to="/projects">Open the record explorer</PillButton>
        </Magnetic>
        <Magnetic>
          <PillButton to="/contact" variant="outline">
            Start a verification pilot
          </PillButton>
        </Magnetic>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.6 }}
        className="mt-16 h-px w-full origin-left bg-hairline-strong"
      />
    </section>
  )
}
