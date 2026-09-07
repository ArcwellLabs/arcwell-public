import Reveal from '@/components/Reveal'

const LOGOS = ['NORTHBOUND', 'HELIX', 'TERRA', 'PULSE', 'ATLAS', 'ORBIT', 'HALO', 'EMBER']

/** §5, [05] Static logo strip: 8 wordmarks sliced from logo-strip.svg, 40% opacity. */
export default function LogoStrip() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-16">
        <Reveal>
          <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            ( Record series anchored on ARC )
          </p>
        </Reveal>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {LOGOS.map((name, i) => (
            <Reveal key={name} delay={i * 0.06} y={16}>
              <div
                role="img"
                aria-label={name}
                className="relative h-10 w-[150px] overflow-hidden opacity-40 transition-opacity duration-300 hover:opacity-100"
              >
                <img
                  src="/logo-strip.svg"
                  alt=""
                  aria-hidden
                  className="absolute left-0 top-0 h-10 w-[1200px] max-w-none"
                  style={{ transform: `translateX(-${i * 150}px)` }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
