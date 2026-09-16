import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Send, Twitter } from "lucide-react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/anim";
import { comingSoon } from "@/lib/comingSoon";
import Reveal from "@/components/Reveal";
import Stars from "@/components/Stars";

const SITEMAP = [
  { to: "/", label: "Home" },
  { to: "/studio", label: "Operating model" },
  { to: "/projects", label: "Record explorer" },
  { to: "/articles", label: "Field notes" },
  { to: "/contact", label: "Start a pilot" },
  { to: "/dashboard", label: "Dashboard" },
];

const SOCIALS = [
  { icon: Twitter, label: "X" },
  { icon: Send, label: "Telegram" },
];

/** Global footer: topo bg, newsletter, giant email, quote card, nav columns, ghost wordmark. */
export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const wordmark = wordmarkRef.current;
    if (!footer || !wordmark || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wordmark,
        { yPercent: 105 },
        {
          yPercent: 30,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top 90%",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
    }, footer);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative overflow-hidden border-t border-hairline bg-bg">
      {/* Topographic contour background */}
      <img
        src="/footer-topo.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />

      <div className="container-infini relative">
        {/* Row 2, giant email + quote card */}
        <div className="grid grid-cols-12 gap-10 border-b border-hairline py-16 md:py-24">
          <Reveal className="col-span-12 lg:col-span-7">
            <Link
              to="/contact"
              className="group inline-flex items-start gap-3 font-display text-[clamp(32px,4.5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink"
            >
              <span className="relative">
                Start a pilot
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100"
                />
              </span>
              <ArrowUpRight className="mt-2 h-[0.6em] w-[0.6em] shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            <div className="mt-10 space-y-1 text-sm leading-relaxed text-ink-muted">
              <p className="kicker mb-3">Network</p>
              <p>ARC mainnet</p>
              <p>Read-only API + public explorer</p>
              <p>Response window: 24-48h UTC</p>
            </div>
          </Reveal>
          <Reveal delay={0.12} className="col-span-12 lg:col-span-5">
            <figure className="rounded-[20px] border border-hairline bg-surface p-8">
              <Stars size={16} />
              <blockquote className="mt-5 text-lg leading-relaxed text-ink">
                "ARCWELL gave us a tamper-evident record layer without touching execution."
              </blockquote>
              <figcaption className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                Operations lead, Helix RecordSeries
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* Row 3, nav columns */}
        <div className="grid grid-cols-12 gap-8 py-14">
          <nav className="col-span-6 md:col-span-3" aria-label="Sitemap">
            <p className="kicker mb-5">Sitemap</p>
            <ul className="space-y-3">
              {SITEMAP.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="col-span-6 md:col-span-3">
            <p className="kicker mb-5">Socials</p>
            <ul className="space-y-3">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => comingSoon(label)}
                    className="group inline-flex min-h-[32px] items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <nav className="col-span-12 md:col-span-6 md:text-right" aria-label="Legal">
            <p className="kicker mb-5">Legal</p>
            <div className="flex flex-col gap-3 text-sm text-ink-muted md:items-end">
              <span>© 2025 ARCWELL</span>
              <div className="flex gap-6">
                <Link
                  to="/dashboard"
                  search={{ view: "settings" }}
                  className="transition-colors hover:text-ink"
                >
                  Product limits
                </Link>
                <Link to="/contact" className="transition-colors hover:text-ink">
                  Pilot terms
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Giant cropped ghost wordmark */}
      <div className="relative overflow-hidden" aria-hidden>
        <div
          ref={wordmarkRef}
          className="select-none whitespace-nowrap text-center font-display text-[clamp(160px,22vw,420px)] font-bold leading-[0.75] tracking-[-0.04em] text-surface-2 transition-colors duration-700 hover:text-ink will-change-transform"
        >
          ARCWELL®
        </div>
      </div>
    </footer>
  );
}
