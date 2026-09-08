import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const SERIES = [
  { index: '01', title: 'Lumen Records', category: 'Registry', events: '1,284 events', anchors: '312 anchors', status: 'Verified', img: '/proj-01-lumen.png' },
  { index: '02', title: 'Helix Dataset', category: 'Verifier', events: '2,047 events', anchors: '486 anchors', status: 'Verified', img: '/proj-02-helix.png' },
  { index: '03', title: 'Terra Case File', category: 'Evidence', events: '968 events', anchors: '201 anchors', status: 'Under review', img: '/proj-03-terra.png' },
  { index: '04', title: 'Orbit Series', category: 'Explorer', events: '1,530 events', anchors: '344 anchors', status: 'Verified', img: '/proj-04-orbit.png' },
  { index: '05', title: 'Pulse Records', category: 'Corrections', events: '872 events', anchors: '190 anchors', status: 'Open dispute', img: '/proj-05-pulse.png' },
  { index: '06', title: 'Northbound Set', category: 'Registry', events: '1,109 events', anchors: '265 anchors', status: 'Verified', img: '/proj-06-north.png' },
]

/** §5, [04] RecordSeries grid: 6 verification workspaces with event/anchor counts + dispute status. */
export default function CaseStudies() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionKicker index="04" label="Record explorer" />
            <MaskLines
              lines={['Record series']}
              as="h2"
              className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
            />
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-faint">Anchored on ARC</p>
          </div>
          <Reveal>
            <Link
              to="/projects"
              className="group inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
            >
              [12] All record series
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERIES.map((c, i) => (
            <Reveal key={c.index} delay={(i % 3) * 0.12} y={60}>
              <Link to="/projects" data-cursor="View" className="group block">
                <div className="relative overflow-hidden rounded-2xl border border-hairline transition-colors duration-500 group-hover:border-hairline-strong">
                  <img
                    src={c.img}
                    alt={`${c.title}, ${c.category} workspace`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 flex translate-y-full justify-center bg-gradient-to-t from-[rgba(10,10,11,0.85)] to-transparent pb-5 pt-14 transition-transform duration-500 ease-out group-hover:translate-y-0"
                  >
                    <span className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-bg">
                      Open workspace
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.18em] text-faint">
                  <span>[{c.index}]</span>
                  <span>
                    {c.events} · {c.anchors}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <h3 className="font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
                    {c.title}
                  </h3>
                  <span className="shrink-0 rounded-full border border-hairline px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    {c.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{c.category}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
