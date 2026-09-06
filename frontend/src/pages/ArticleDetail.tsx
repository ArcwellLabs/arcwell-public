import { Fragment, useEffect, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Twitter } from 'lucide-react'
import { comingSoon } from '@/lib/comingSoon'

import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/anim'
import MaskLines from '@/components/MaskLines'
import PillButton from '@/components/PillButton'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'
import ArticleCard from '@/pages/articles/ArticleCard'
import AuthorCard from '@/pages/articles/AuthorCard'
import { AUTHOR, COMPARISON_ROWS, getArticle, getRelated } from '@/data/articles'
import type { Article, ArticleBlock, Inline } from '@/data/articles'

/* ------------------------------------------------------------------ */
/* Reading progress bar, 2px accent line fixed under the navbar       */
/* ------------------------------------------------------------------ */

function ReadingProgress({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    const target = targetRef.current
    if (!bar || !target) return
    if (prefersReducedMotion()) {
      gsap.set(bar, { scaleX: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: target,
            start: 'top 72px',
            end: 'bottom bottom',
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        },
      )
    })
    return () => ctx.revert()
  }, [targetRef])

  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed inset-x-0 top-[72px] z-[60] h-[2px] origin-left bg-accent"
      style={{ transform: 'scaleX(0)' }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Hero image, clip-path reveal 1.1s                                  */
/* ------------------------------------------------------------------ */

function HeroImage({ article }: { article: Article }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.out', delay: 0.15 },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="overflow-hidden rounded-[20px] border border-hairline bg-surface">
      <img src={article.image} alt={article.title} className="aspect-[3/2] w-full object-cover" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Slide-in from the right (author card)                               */
/* ------------------------------------------------------------------ */

function SlideInRight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { x: 0, opacity: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.5 },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inline text renderer, links get an underline that slides on hover  */
/* ------------------------------------------------------------------ */

function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <Fragment key={i}>{part}</Fragment>
        ) : (
          <Link key={i} to={part.href} className="group/l relative text-ink transition-colors duration-300">
            {part.text}
            <span aria-hidden className="absolute bottom-0 left-0 h-px w-full bg-hairline-strong" />
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover/l:origin-left group-hover/l:scale-x-100"
            />
          </Link>
        ),
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Pull quote, words color-reveal on scroll scrub                     */
/* ------------------------------------------------------------------ */

function PullQuote({ text }: { text: string }) {
  const ref = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = el.querySelectorAll<HTMLElement>('[data-word]')
    if (prefersReducedMotion()) {
      gsap.set(words, { color: '#EDEDEA' })
      return
    }
    const ctx = gsap.context(() => {
      gsap.to(words, {
        color: '#EDEDEA',
        stagger: 0.06,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 40%', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <blockquote
      ref={ref}
      className="my-14 border-l-2 border-accent pl-8 font-display text-[28px] font-medium leading-[1.35] tracking-[-0.01em]"
    >
      {text.split(' ').map((word, i) => (
        <span key={i} data-word className="text-faint">
          {word}{' '}
        </span>
      ))}
    </blockquote>
  )
}

/* ------------------------------------------------------------------ */
/* Comparison table, mono, rows slide in stagger 0.06s                */
/* ------------------------------------------------------------------ */

function ComparisonTable() {
  return (
    <div className="my-12 overflow-x-auto rounded-2xl border border-hairline bg-surface">
      <table className="w-full min-w-[560px] border-collapse text-left font-mono text-xs">
        <thead>
          <tr className="border-b border-hairline text-faint">
            <th className="px-5 py-4 font-medium uppercase tracking-[0.14em]" />
            <th className="px-5 py-4 font-medium uppercase tracking-[0.14em]">Onchain footprint</th>
            <th className="px-5 py-4 font-medium uppercase tracking-[0.14em]">Cost profile</th>
            <th className="px-5 py-4 font-medium uppercase tracking-[0.14em]">Auditability</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={row.label}
              data-row
              className={
                i === COMPARISON_ROWS.length - 1
                  ? 'bg-surface-2 text-ink'
                  : 'border-b border-hairline text-ink-muted'
              }
            >
              <td className="whitespace-nowrap px-5 py-4 text-ink">{row.label}</td>
              <td className="px-5 py-4">{row.footprint}</td>
              <td className="px-5 py-4">{row.cost}</td>
              <td className="px-5 py-4">{row.auditability}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Wraps the table to drive the row slide-in stagger. */
function ComparisonBlock() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rows = el.querySelectorAll<HTMLElement>('[data-row]')
    if (prefersReducedMotion()) {
      gsap.set(rows, { x: 0, opacity: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rows,
        { x: 24, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref}>
      <ComparisonTable />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Long-form body block renderer                                       */
/* ------------------------------------------------------------------ */

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'lead':
      return (
        <Reveal y={24} start="top 88%">
          <p className="text-[18px] leading-[1.8] text-ink-muted first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[56px] first-letter:font-bold first-letter:leading-[0.85] first-letter:text-ink">
            <InlineText parts={block.text} />
          </p>
        </Reveal>
      )
    case 'paragraph':
      return (
        <Reveal y={24} start="top 88%">
          <p className="text-[18px] leading-[1.8] text-ink-muted">
            <InlineText parts={block.text} />
          </p>
        </Reveal>
      )
    case 'heading':
      return (
        <Reveal y={24} start="top 88%">
          <h2 className="mt-16 mb-2 flex items-baseline gap-4 font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
            <span className="font-mono text-sm font-normal tracking-[0.14em] text-faint">{block.index}.</span>
            {block.text}
          </h2>
        </Reveal>
      )
    case 'quote':
      return <PullQuote text={block.text} />
    case 'comparison':
      return <ComparisonBlock />
    case 'tips':
      return (
        <div className="my-10 space-y-0 border-t border-hairline">
          {block.items.map((tip, i) => (
            <Reveal key={tip.title} y={24} start="top 88%" delay={i * 0.05}>
              <div className="flex gap-6 border-b border-hairline py-6">
                <span className="font-mono text-sm tracking-[0.14em] text-faint tabular">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-medium text-ink">{tip.title}</p>
                  <p className="mt-2 text-base leading-[1.7] text-ink-muted">{tip.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* §3, Share / author footer                                          */
/* ------------------------------------------------------------------ */

function ShareRow() {
  return (
    <Reveal y={24}>
      <div className="flex flex-wrap items-center gap-8">
        <AuthorCard className="min-w-[300px] flex-1" />
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-faint">Share</span>
          <button
            type="button"
            onClick={() => comingSoon('X')}
            aria-label="Share on X, coming soon"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors duration-300 hover:border-hairline-strong hover:text-ink"
          >
            <Twitter size={16} />
          </button>
        </div>
      </div>
    </Reveal>
  )
}


/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ArticleDetail() {
  const { slug } = useParams({ from: "/articles/$slug" })
  const article = getArticle(slug)
  const pageRef = useRef<HTMLDivElement>(null)

  // Refresh ScrollTrigger once the article layout has settled
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => window.clearTimeout(id)
  }, [slug])

  if (!article) {
    return (
      <section className="container-infini py-[clamp(96px,14vw,200px)] text-center">
        <SectionKicker index="··" label="Field notes" align="center" />
        <h1 className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink">
          Note not found.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg leading-[1.6] text-ink-muted">
          This entry may have been moved or unpublished. The full archive is one click away.
        </p>
        <div className="mt-10 flex justify-center">
          <PillButton to="/articles">Back to field notes</PillButton>
        </div>
      </section>
    )
  }

  const related = getRelated(article)

  return (
    <div ref={pageRef}>
      <ReadingProgress targetRef={pageRef} />

      {/* §1, Article hero */}
      <section className="container-infini pt-10 md:pt-16">
        <Link
          to="/articles"
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
          All field notes
        </Link>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left (cols 1-7): image + meta row */}
          <div className="lg:col-span-7">
            <HeroImage article={article} />
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-faint">
              {article.category}, {article.date}, {article.readTime} read
            </p>
          </div>

          {/* Right (cols 8-12): sticky meta column */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[120px]">
              <MaskLines
                lines={article.titleLines}
                className="font-display text-[clamp(32px,4vw,64px)] font-bold leading-[1.0] tracking-[-0.03em] text-ink"
                start="top 98%"
              />
              <Reveal delay={0.35} y={24}>
                <p className="mt-6 text-lg leading-[1.6] text-ink-muted">{article.excerpt}</p>
              </Reveal>
              <SlideInRight className="mt-8">
                <AuthorCard />
              </SlideInRight>
            </div>
          </div>
        </div>
      </section>

      {/* §2, Long-form body */}
      <article className="container-infini">
        <div className="mx-auto max-w-3xl space-y-8 py-24">
          {article.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
          <p className="pt-6 font-mono text-xs uppercase tracking-[0.18em] text-faint">
            Filed under {article.category}, {AUTHOR.name}, {AUTHOR.role}. ARCWELL is a software
            and verification service; nothing here is investment, legal, or compliance advice.
          </p>
        </div>
      </article>

      {/* §3, Share / author footer */}
      <section className="border-t border-hairline">
        <div className="container-infini py-14">
          <ShareRow />
        </div>
      </section>

      {/* §4, Related insights [04] */}
      <section className="border-t border-hairline">
        <div className="container-infini py-[clamp(96px,12vw,160px)]">
          <SectionKicker index="04" label="Related field notes" />
          <MaskLines
            lines={['Keep verifying.']}
            className="mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
          />
          <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-3">
            {related.map((rel, i) => (
              <Reveal key={rel.slug} delay={i * 0.1}>
                <ArticleCard article={rel} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
