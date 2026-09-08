import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

/** Abstract concentric-ring anchor glyph, pure SVG, no imagery. */
function AnchorGlyph() {
  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full" role="img" aria-label="Abstract anchor rings">
      <g fill="none" stroke="rgba(237,237,234,0.14)" strokeWidth="1">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="150" strokeDasharray="4 8" />
        <circle cx="200" cy="200" r="110" />
        <circle cx="200" cy="200" r="70" strokeDasharray="2 6" />
      </g>
      <circle cx="200" cy="200" r="26" fill="none" stroke="#E8E8E4" strokeWidth="1" />
      <circle cx="200" cy="200" r="4" fill="#E8E8E4" />
      <g stroke="rgba(237,237,234,0.2)" strokeWidth="1">
        <line x1="200" y1="10" x2="200" y2="174" />
        <line x1="200" y1="226" x2="200" y2="390" />
        <line x1="10" y1="200" x2="174" y2="200" />
        <line x1="226" y1="200" x2="390" y2="200" />
      </g>
      <text x="200" y="252" textAnchor="middle" fill="#8B8B93" fontSize="10" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
        ANCHORED · ARC
      </text>
    </svg>
  )
}

/** §3, [03] Product boundary: duotone statement + proof-scope note + abstract glyph. */
export default function Boundary() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="03" label="Product boundary" />

        <div className="mt-12 grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8">
            <MaskLines
              lines={['Software for evidence,', 'not execution.']}
              className="font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
            />
            <Reveal delay={0.15}>
              <p className="mt-10 max-w-3xl text-[clamp(20px,2.4vw,32px)] leading-[1.35] text-faint">
                ARCWELL is software for <span className="text-ink">recording, anchoring, and verifying evidence</span> of
                transactions that occurred through systems{' '}
                <span className="text-ink">operated by other parties</span>. The underlying transaction always happens
                somewhere else, our job is the <span className="text-ink">proof trail</span>, never the event itself.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="mt-10 max-w-2xl rounded-2xl border border-hairline bg-surface p-6 md:p-8">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">What an ARC entry proves</p>
                <p className="mt-4 text-base leading-[1.65] text-ink-muted">
                  An ARC entry proves specified data was submitted at a given time and has not been altered; it does not
                  by itself prove the underlying transaction was lawful, valid, authorized, complete, or correctly
                  classified.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Reveal delay={0.2} className="lg:sticky lg:top-28">
              <div className="mx-auto max-w-[320px] lg:max-w-none">
                <AnchorGlyph />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
