import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

// [bold flag, text] segments, bold segments are emphasised in ink weight
const SEGMENTS: Array<[boolean, string]> = [
  [false, 'Capital-markets tooling wants to execute the transaction. '],
  [true, 'ARCWELL does not. '],
  [false, 'We anchor '],
  [true, 'tamper-evident evidence'],
  [false, ' on ARC, preserve an append-only trail, and let '],
  [true, 'independent verifiers'],
  [false, ' check what was submitted. Submit, anchor, verify, correct.'],
]

const CHIPS = ['Proof-only', 'Append-only audit', 'Independent verification']

/** §3, [02] Duotone approach statement with a scroll-scrubbed word color reveal. */
export default function Approach() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelectorAll('[data-scrub-word]'),
        { color: '#55555C' },
        {
          color: '#EDEDEA',
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: {
            trigger: section.querySelector('[data-scrub-text]'),
            start: 'top 62%',
            end: '+=50%',
            scrub: true,
          },
        },
      )
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <SectionKicker index="02" label="Approach" />
        <h2 className="sr-only">Approach — how ARCWELL anchors evidence</h2>
        <p
          data-scrub-text
          className="mt-10 max-w-5xl text-[clamp(26px,3.4vw,48px)] leading-[1.3] text-faint"
        >
          {SEGMENTS.flatMap(([bold, text], si) =>
            text.split(' ').map((word, wi) =>
              word === '' ? null : (
                <span key={`${si}-${wi}`}>
                  <span data-scrub-word className={bold ? 'font-medium' : undefined}>
                    {word}
                  </span>{' '}
                </span>
              ),
            ),
          )}
        </p>
        <Reveal delay={0.1} className="mt-14">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {CHIPS.map((chip, i) => (
              <span key={chip} className="flex items-center gap-5">
                {i > 0 && <span className="h-4 w-px bg-hairline-strong" aria-hidden />}
                <span className="kicker">[ {chip} ]</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
