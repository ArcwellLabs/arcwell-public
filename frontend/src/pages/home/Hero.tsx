import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowRight, Fingerprint } from 'lucide-react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import { scrollToTarget } from '@/lib/lenis'
import AvailabilityDot from '@/components/AvailabilityDot'
import PillButton from '@/components/PillButton'

const LINE_ONE = 'ARCWELL'
const LINE_TWO = 'ON ARC®'

function WordmarkLine({ text, indent = false }: { text: string; indent?: boolean }) {
  return (
    <span className={`block overflow-hidden ${indent ? 'ml-[8vw]' : ''}`}>
      {text.split('').map((ch, i) => (
        <span key={i} data-hero-char className="inline-block will-change-transform">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

const MANIFESTO =
  'Verifiable records for real-world transactions. Anchor evidence on ARC, preserve a tamper-evident audit trail, and let independent verifiers check what was submitted.'

/** §1, Full-viewport fluid hero with char-split wordmark, manifesto, anchor status card. */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLVideoElement>(null)
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  const manifestoRef = useRef<HTMLParagraphElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Load: background settle
      gsap.fromTo(
        bgRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 1, duration: 2.4, ease: 'power2.out' },
      )
      // Wordmark char reveal
      gsap.fromTo(
        section.querySelectorAll('[data-hero-char]'),
        { yPercent: 110, rotate: 4 },
        { yPercent: 0, rotate: 0, duration: 1.1, ease: 'power4.out', stagger: 0.04, delay: 0.3 },
      )
      // Manifesto word fade-up
      gsap.fromTo(
        section.querySelectorAll('[data-hero-word]'),
        { opacity: 0.15, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.02, delay: 0.9 },
      )
      // Status strip pop
      gsap.fromTo(
        statusRef.current?.children ?? [],
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.08, delay: 1.2 },
      )
      // Scroll scrub parallax
      gsap.to(wordmarkRef.current, {
        yPercent: -15,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: '80% top', scrub: true },
      })
      gsap.to(bgRef.current, {
        yPercent: 10,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: '80% top', scrub: true },
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative -mt-[72px] min-h-[max(720px,100dvh)] overflow-hidden">
      {/* CSS fallback backdrop + fluid imagery */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#1a1a1f_0%,#0A0A0B_65%)]"
      />
      <video
        ref={bgRef}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        src="/hero-fluid.mp4"
        poster="/hero-fluid.png"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(rgba(10,10,11,0.55),rgba(10,10,11,0.85)_80%)]"
      />

      <div className="container-infini relative flex min-h-[max(720px,100dvh)] flex-col pt-[104px]">
        {/* Top-left marker */}
        <div className="flex items-center gap-4 pt-6">
          <span className="kicker">Proof-only infrastructure</span>
          <span className="h-px w-16 bg-hairline-strong" aria-hidden />
        </div>

        {/* Center grid */}
        <div className="grid flex-1 grid-cols-12 items-center gap-6 py-16">
          <div className="col-span-12 lg:col-span-8">
            <h1
              ref={wordmarkRef}
              className="font-display text-[clamp(56px,12vw,200px)] font-bold uppercase leading-[0.88] tracking-[-0.04em] text-ink"
            >
              <WordmarkLine text={LINE_ONE} />
              <WordmarkLine text={LINE_TWO} indent />
              <span className="sr-only">
                {' '}— Transaction-Proof Infrastructure on ARC
              </span>
            </h1>
          </div>
          <div className="col-span-12 max-w-md lg:col-span-4 lg:justify-self-end">
            <p className="kicker">[ Transaction evidence · ARC ]</p>
            <p ref={manifestoRef} className="mt-5 text-lg leading-[1.65] text-ink-muted">
              {MANIFESTO.split(' ').map((word, i) => (
                <span key={i}>
                  <span data-hero-word className="inline-block will-change-transform">
                    {word}
                  </span>{' '}
                </span>
              ))}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PillButton to="/dashboard">Open dashboard</PillButton>
              <PillButton to="/projects" variant="outline">
                Verify records
              </PillButton>
            </div>
            <button
              type="button"
              onClick={() => scrollToTarget('#process')}
              className="group mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink"
            >
              See how proof works
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Bottom row: network status strip (no human imagery) */}
        <div className="flex items-end justify-between pb-20">
          <div ref={statusRef} className="flex flex-wrap items-center gap-4">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-surface/60 backdrop-blur-md">
              <Fingerprint size={18} className="text-ink" aria-hidden />
              <AvailabilityDot className="absolute -bottom-0.5 -right-0.5" />
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink">ARC network, operational</p>
              <p className="mt-1 font-mono text-xs tracking-[0.14em] text-ink-muted">
                128k+ anchors · 340 organizations
              </p>
            </div>
          </div>
        </div>

        {/* Bottom hairline + scroll hint */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="h-px w-full bg-hairline" aria-hidden />
          <div className="pointer-events-none absolute -top-10 left-1/2 flex -translate-x-1/2 items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            ( Scroll )
            <ArrowDown size={13} className="animate-bob" />
          </div>
        </div>
      </div>

    </section>
  )
}
