import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Twitter } from 'lucide-react'
import Reveal from '@/components/Reveal'
import AvailabilityDot from '@/components/AvailabilityDot'
import { comingSoon } from '@/lib/comingSoon'

const EXPLORER_URL = '/projects'

/** §2, [02] Contact info band: X channel, record explorer link, response window + pilot availability. */
export default function InfoRow() {
  return (
    <section className="container-infini mt-[clamp(72px,9vw,140px)]">
      <div className="grid border-y border-hairline md:grid-cols-3">
        {/* X channel */}
        <Reveal className="border-b border-hairline py-12 md:border-b-0 md:pr-10">
          <p className="kicker">Updates</p>
          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => comingSoon('X')}
              aria-label="ARCWELL on X, coming soon"
              className="group flex min-h-[44px] items-center gap-3 text-left font-display text-2xl font-semibold text-ink transition-colors hover:text-ink/80"
            >
              <Twitter size={22} className="shrink-0" aria-hidden />
              Follow on X
            </button>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            Product notes and network status. Channel opens shortly.
          </p>
        </Reveal>

        {/* Record explorer */}
        <Reveal
          delay={0.1}
          className="border-b border-hairline py-12 md:border-b-0 md:border-l md:px-10"
        >
          <p className="kicker">Network</p>
          <Link
            to={EXPLORER_URL}
            className="group mt-4 flex min-h-[44px] items-start gap-3 font-display text-2xl font-semibold leading-snug text-ink transition-colors hover:text-ink/80"
          >
            Public record explorer
            <ArrowUpRight
              size={18}
              className="mt-1 shrink-0 text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
              aria-hidden
            />
          </Link>
          <p className="mt-3 text-sm text-ink-muted">
            Browse anchored records, provenance, and verification history on ARC.
          </p>
        </Reveal>

        {/* Response window */}
        <Reveal delay={0.2} className="py-12 md:border-l md:border-hairline md:pl-10">
          <p className="kicker">Response window</p>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">Mon - Fri, 9:00 - 18:00 UTC</p>
          <p className="mt-3 flex items-center gap-3 text-sm text-ink-muted">
            <AvailabilityDot />
            Pilot slots open this quarter
          </p>
        </Reveal>
      </div>
    </section>
  )
}
