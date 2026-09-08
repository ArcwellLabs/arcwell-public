import { useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion'
import { Database, FileStack, Fingerprint, ListChecks, Package, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineEntity {
  icon: typeof Database
  name: string
  role: string
  fields: string[]
}

export const ENTITIES: TimelineEntity[] = [
  {
    icon: Users,
    name: 'OrganizationProfile',
    role: 'Who submits. A registered organization with a verified signing identity and a public profile on the explorer.',
    fields: ['orgId', 'signingKeys[]', 'visibilityDefault'],
  },
  {
    icon: Database,
    name: 'RecordSeries',
    role: 'How records are grouped. An append-only stream of related transaction records under one visibility policy.',
    fields: ['seriesId', 'anchorPolicy', 'retentionClass'],
  },
  {
    icon: Fingerprint,
    name: 'ParticipantReference',
    role: 'Who is referenced. Privacy-preserving pointers to counterparties, never personal data on chain.',
    fields: ['participantRef', 'roleCode', 'consentFlag'],
  },
  {
    icon: FileStack,
    name: 'TransactionRecord',
    role: 'What happened. A structured description of an off-chain event, hashed and anchored on ARC.',
    fields: ['evidenceHash', 'eventTimestamp', 'chainAnchor'],
  },
  {
    icon: ListChecks,
    name: 'ValidationResult',
    role: 'What verifiers found. Independent confirmations and discrepancies, each signed and time-stamped.',
    fields: ['verifierId', 'finding', 'quorumWeight'],
  },
  {
    icon: Package,
    name: 'EvidenceBundle',
    role: 'What backs it. The documents, signatures, and timestamps a reviewer can inspect against the anchor.',
    fields: ['bundleUri', 'documentCount', 'retention'],
  },
]

/**
 * Scroll-reactive spine timeline. A single rail runs down the middle (left on
 * mobile) and fills/unfills in perfect sync with scroll position; each node
 * lights up once the fill head passes it, and the row nearest the head is the
 * "active" row (raised surface, brighter type) — the reactive equivalent of a
 * hovered card.
 */
export default function DataModelTimeline() {
  const railRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)

  // Rail travel is mapped from "first node hits 62% of viewport" to
  // "last node hits 62% of viewport", so the head tracks the rows exactly.
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ['start 62%', 'end 62%'],
  })
  const fill = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.4 })
  const fillScale = useTransform(fill, (v) => Math.max(0.0001, v))
  const headOpacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const n = ENTITIES.length
    // Node i sits at i/(n-1) along the rail; a node is reached slightly early
    // so the reveal never lags behind the visible fill head.
    const idx = Math.floor(v * (n - 1) + 0.35)
    const clamped = v <= 0 ? -1 : Math.min(n - 1, idx)
    setActive((prev) => (prev === clamped ? prev : clamped))
  })

  return (
    <div ref={railRef} className="relative mt-14 sm:mt-20">
      {/* Rail: left on mobile, centered from lg up */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[15px] top-0 w-px bg-hairline lg:left-1/2 lg:-translate-x-1/2"
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-full origin-top bg-ink"
          style={{ scaleY: fillScale }}
        />
        <motion.div
          className="absolute inset-x-0 top-0 h-full origin-top"
          style={{ scaleY: fillScale }}
        >
          <motion.span
            className="absolute -left-[3px] bottom-0 h-1.5 w-1.5 rounded-full bg-ink shadow-[0_0_18px_4px_rgba(237,237,234,0.35)]"
            style={{ opacity: headOpacity }}
          />
        </motion.div>
      </div>

      <ol className="relative space-y-10 sm:space-y-14 lg:space-y-20">
        {ENTITIES.map((entity, i) => {
          const reached = i <= active
          const isActive = i === active
          const flip = i % 2 === 1 // alternate sides on desktop
          return (
            <li
              key={entity.name}
              className="relative pl-12 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-12 lg:pl-0"
            >
              {/* Node on the rail */}
              <span
                className={cn(
                  'absolute left-[15px] top-[26px] -translate-x-1/2 lg:static lg:order-2 lg:col-start-2 lg:translate-x-0',
                  'flex h-[13px] w-[13px] items-center justify-center rounded-full border bg-bg transition-colors duration-500',
                  reached ? 'border-ink' : 'border-hairline-strong',
                )}
                aria-hidden
              >
                <motion.span
                  className="block h-[5px] w-[5px] rounded-full bg-ink"
                  animate={{ scale: reached ? 1 : 0, opacity: reached ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
                {isActive && (
                  <span className="pointer-events-none absolute h-[13px] w-[13px] animate-pulse-ring rounded-full border border-ink/50" />
                )}
              </span>

              {/* Icon plate + index */}
              <motion.div
                className={cn(
                  'flex items-center gap-4',
                  flip
                    ? 'lg:order-3 lg:col-start-3 lg:justify-start'
                    : 'lg:order-1 lg:col-start-1 lg:flex-row-reverse lg:justify-start',
                )}
                animate={{ opacity: reached ? 1 : 0.42 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-500 sm:h-14 sm:w-14',
                    isActive
                      ? 'border-ink/40 bg-surface-2 shadow-card'
                      : reached
                        ? 'border-hairline-strong bg-surface'
                        : 'border-hairline bg-bg',
                  )}
                >
                  <entity.icon
                    size={20}
                    className={cn('transition-colors duration-500', reached ? 'text-ink' : 'text-faint')}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    'font-mono text-xs uppercase tracking-[0.18em] tabular transition-colors duration-500',
                    reached ? 'text-ink-muted' : 'text-faint',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </motion.div>

              {/* Copy */}
              <motion.div
                className={cn(
                  'mt-4 lg:mt-0',
                  flip
                    ? 'lg:order-1 lg:col-start-1 lg:text-right'
                    : 'lg:order-3 lg:col-start-3 lg:text-left',
                )}
                animate={{
                  opacity: reached ? 1 : 0.4,
                  y: reached ? 0 : 14,
                  x: 0,
                }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <h3
                  className={cn(
                    'font-mono text-base font-medium tracking-tight transition-colors duration-500 sm:text-lg',
                    reached ? 'text-ink' : 'text-ink-muted',
                  )}
                >
                  {entity.name}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted lg:inline-block">
                  {entity.role}
                </p>
                <div
                  className={cn(
                    'mt-4 flex flex-wrap gap-2',
                    flip ? 'lg:justify-end' : 'lg:justify-start',
                  )}
                >
                  {entity.fields.map((field) => (
                    <motion.span
                      key={field}
                      className={cn(
                        'rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-500',
                        reached
                          ? 'border-hairline-strong text-ink-muted'
                          : 'border-hairline text-faint',
                      )}
                      animate={{ opacity: reached ? 1 : 0.5 }}
                    >
                      {field}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
