import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'

const ARTICLES = [
  {
    img: '/art-01.png',
    slug: 'proof-only-infrastructure',
    meta: 'Boundary, Mar 2025',
    title: 'What proof-only infrastructure actually proves.',
    excerpt: 'An anchor proves submission and integrity, not legality. Where the line sits.',
  },
  {
    img: '/art-03.png',
    slug: 'evidence-hashing-on-arc',
    meta: 'Engineering, Feb 2025',
    title: 'Evidence hashing, from upload to anchor.',
    excerpt: 'How content-addressed bundles and signatures become a tamper-evident trail.',
  },
  {
    img: '/art-02.png',
    slug: 'verifier-network-design',
    meta: 'Verification, Jan 2025',
    title: 'Designing a verifier network that resists collusion.',
    excerpt: 'Objective eligibility rules, transparent rewards, and structured appeals.',
  },
]

/** §12, [11] Field-notes teaser grid with hover excerpt panels. */
export default function ArticlesTeaser() {
  return (
    <section className="border-t border-hairline">
      <div className="container-infini py-[clamp(96px,12vw,200px)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionKicker index="11" label="Field notes" />
            <MaskLines
              lines={['From the field notes']}
              as="h2"
              className="mt-6 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
            />
          </div>
          <Reveal>
            <Link
              to="/articles"
              className="group inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
            >
              [06] All field notes
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {ARTICLES.map((article, i) => (
            <Reveal key={article.title} delay={i * 0.12}>
              <Link to="/articles/$slug" params={{ slug: article.slug }} data-cursor="Read" className="group block">
                <div className="relative overflow-hidden rounded-2xl border border-hairline transition-colors duration-500 group-hover:border-hairline-strong">
                  <img
                    src={article.img}
                    alt={article.title}
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 translate-y-full bg-surface/90 p-5 backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0"
                  >
                    <p className="text-sm leading-relaxed text-ink-muted">{article.excerpt}</p>
                  </div>
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-faint">{article.meta}</p>
                <h3 className="mt-2 font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
                  {article.title}
                </h3>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
