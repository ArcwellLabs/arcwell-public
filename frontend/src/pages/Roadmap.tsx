import { useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, BookOpen, MoveRight } from "lucide-react";
import roadmap from "@/data/product-roadmap.json";
import { getLenis } from "@/lib/lenis";
import RoadmapAscii from "./RoadmapAscii";
import "./roadmap.css";

export default function Roadmap() {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const activeIndex = useRef(0);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start center", "end center"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(roadmap.phases.length - 1, Math.floor(value * roadmap.phases.length));
    if (next !== activeIndex.current) {
      activeIndex.current = next;
      setActive(next);
    }
  });
  const still = Boolean(reduce) || paused;
  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { immediate: still, duration: 1.1 });
    else window.scrollTo({ top, behavior: still ? "instant" : "smooth" });
    el.focus({ preventScroll: true });
  }
  return (
    <div className="rm-page">
      <div className="rm-topline">
        <span>ARCWELL / PRODUCT DIRECTION</span>
        <span>EDITION 01 · SEPTEMBER 2026</span>
      </div>
      <section className="rm-hero" aria-labelledby="roadmap-title">
        <div className="rm-hero-copy">
          <p className="rm-kicker">
            <span className="rm-status-dot" /> Built in stages. Designed to connect.
          </p>
          <h1 id="roadmap-title">
            The road
            <br />
            <span>ahead.</span>
          </h1>
          <p className="rm-lead">{roadmap.intro}</p>
          <div className="rm-actions">
            <button className="rm-button" onClick={() => jump("foundation")}>
              Explore the roadmap <ArrowDown size={17} />
            </button>
            <Link className="rm-text-link" to="/whitepaper">
              Read the whitepaper <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="rm-hero-object">
          <RoadmapAscii progress={scrollYProgress} active={0} still />
        </div>
        <div className="rm-hero-foot">
          <span>06 STAGES / ONE CONNECTED EXPERIENCE</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>
      <section className="rm-intro" aria-label="Roadmap status">
        <h2>
          One foundation.
          <br />
          <span>More possibilities.</span>
        </h2>
        <div>
          <p>
            Start with an experience people can understand. Connect the underlying services. Expand
            the tools when the foundations are ready.
          </p>
          <p className="rm-small">
            This is a direction of travel, not a dated delivery promise. Each stage has a release
            gate. Status reviewed {roadmap.asOf}.
          </p>
        </div>
      </section>
      <div ref={track} className="rm-journey" id="stages">
        <aside className="rm-stage" aria-label="Roadmap explorer">
          <div className="rm-stage-heading">
            <span>THE SYSTEM TAKES SHAPE</span>
            <button
              onClick={() => setPaused(!paused)}
              aria-pressed={paused}
              disabled={Boolean(reduce)}
            >
              {reduce ? "Reduced motion" : paused ? "Enable motion" : "Pause motion"}
            </button>
          </div>
          <RoadmapAscii progress={scrollYProgress} active={active} still={still} />
          <nav className="rm-stage-nav" aria-label="Jump to roadmap stage">
            {roadmap.phases.map((phase, index) => (
              <button
                key={phase.id}
                onClick={() => jump(phase.id)}
                aria-current={active === index ? "step" : undefined}
              >
                <span>{phase.number}</span>
                <span>{phase.short}</span>
              </button>
            ))}
          </nav>
          <div className="rm-progress">
            <motion.div style={{ scaleX: scrollYProgress }} />
          </div>
        </aside>
        <div className="rm-phases">
          {roadmap.phases.map((phase, index) => (
            <section
              className="rm-phase"
              id={phase.id}
              key={phase.id}
              tabIndex={-1}
              aria-labelledby={`${phase.id}-title`}
              style={{ "--phase-index": index } as CSSProperties}
            >
              <div className="rm-phase-meta">
                <span>STAGE {phase.number}</span>
                <span
                  className={`rm-status rm-status-${phase.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {phase.status}
                </span>
              </div>
              <p className="rm-eyebrow">{phase.eyebrow}</p>
              <h2 id={`${phase.id}-title`}>{phase.title}</h2>
              <p className="rm-description">{phase.description}</p>
              <ul>
                {phase.deliverables.map((text) => (
                  <li key={text}>
                    <MoveRight size={16} aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
              <div className="rm-gate">
                <span>{phase.status === "Available" ? "CURRENT BOUNDARY" : "RELEASE GATE"}</span>
                <p>{phase.gate}</p>
              </div>
              <p className="rm-outcome">{phase.outcome}</p>
            </section>
          ))}
        </div>
      </div>
      <section className="rm-closing">
        <span className="rm-kicker">A CLEARER VIEW OF WHAT COMES NEXT</span>
        <h2>
          Follow the thinking.
          <br />
          <span>Try the foundation.</span>
        </h2>
        <div className="rm-actions">
          <Link className="rm-button" to="/whitepaper">
            <BookOpen size={17} /> Read the whitepaper
          </Link>
          <Link className="rm-text-link" to="/dashboard">
            Explore ARCWELL <ArrowUpRight size={17} />
          </Link>
        </div>
        <p>
          Current availability and planned work are kept separate.
          <br />
          No launch dates, investment returns, or provider access are promised by this roadmap.
        </p>
      </section>
    </div>
  );
}
