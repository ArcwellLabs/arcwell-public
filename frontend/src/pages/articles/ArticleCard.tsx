import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { Article } from '@/data/articles'

/**
 * Journal card anatomy (index grid + related posts):
 * 3:2 image with hover zoom + excerpt panel slide-up,
 * mono meta row, H3 title with arrow, mono reading time.
 */
export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to="/articles/$slug" params={{ slug: article.slug }} data-cursor="Read" className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface transition-colors duration-500 group-hover:border-hairline-strong">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 translate-y-full bg-surface/90 p-5 backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0"
        >
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{article.excerpt}</p>
        </div>
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-faint">
        {article.category}, {article.date}
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h3 className="font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
          {article.title}
        </h3>
        <ArrowUpRight
          size={22}
          className="mt-1.5 shrink-0 -translate-x-1 translate-y-1 text-ink opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
        />
      </div>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-faint">{article.readTime} read</p>
    </Link>
  )
}
