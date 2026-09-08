import Reveal from '@/components/Reveal'

/** §2, [01] Anchoring-organizations logo marquee, infinite 40s loop, masked edges, pause on hover. */
export default function LogoMarquee() {
  return (
    <section aria-label="Anchored on ARC" className="border-y border-hairline">
      <Reveal y={24} start="top 90%">
        <div className="flex items-center">
          <p className="container-infini kicker hidden shrink-0 pr-10 lg:block">
            ( Anchored by submitting organizations )
          </p>
          <div className="relative flex-1 overflow-hidden py-10 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max animate-marquee gap-20 hover:[animation-play-state:paused]">
              {[0, 1].map((copy) => (
                <img
                  key={copy}
                  src="/logo-strip.svg"
                  alt="Record series wordmarks: Northbound, Helix, Terra, Pulse, Atlas, Orbit, Halo, Ember"
                  className="h-8 w-auto opacity-50 transition-opacity duration-300 hover:opacity-100"
                  draggable={false}
                />
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
