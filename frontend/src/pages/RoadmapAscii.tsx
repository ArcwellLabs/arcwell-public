import { useEffect, useRef } from "react";
import { type MotionValue } from "framer-motion";
import roadmap from "@/data/product-roadmap.json";

const WIDTH = 100;
const HEIGHT = 44;
const GLYPHS = ".,:;=+*#%@";

// Original ARCWELL geometry. Inspired by Studio Freight's character-based
// Dragonfly identity (AIGA 365 winner, 2022); no third-party artwork or code.
function drawArc(progress: number) {
  const cells = Array<string>(WIDTH * HEIGHT).fill(" ");
  const depth = new Float32Array(WIDTH * HEIGHT).fill(-Infinity);
  const turn = -0.34 + progress * 0.8;
  const tilt = 0.24 + Math.sin(progress * Math.PI) * 0.32;
  const plot = (x: number, y: number, z: number, glyph: string) => {
    const col = Math.round(WIDTH / 2 + x * 18);
    const row = Math.round(HEIGHT / 2 - y * 9.1);
    const at = row * WIDTH + col;
    if (col >= 0 && col < WIDTH && row >= 0 && row < HEIGHT && z > depth[at]) {
      depth[at] = z;
      cells[at] = glyph;
    }
  };
  // Six concentric signal paths form an open arch, one for each roadmap stage.
  for (let band = 0; band < 6; band++) {
    const radius = 1.24 + band * 0.19;
    for (let a = -0.42; a < Math.PI + 0.42; a += 0.014) {
      for (let b = 0; b < Math.PI * 2; b += 0.23) {
        const ripple = Math.sin(a * 5 + progress * 8 + band * 0.7) * 0.04 * progress;
        const r = radius + Math.cos(b) * 0.07 + ripple;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r - 0.62;
        const z = Math.sin(b) * 0.1 + (band - 2.5) * 0.07;
        const rx = x * Math.cos(turn) + z * Math.sin(turn);
        const rz = z * Math.cos(turn) - x * Math.sin(turn);
        const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
        const light = Math.max(
          0,
          Math.min(
            0.99,
            0.42 +
              Math.cos(b - 0.7) * 0.28 +
              Math.sin(a) * 0.2 +
              (band === Math.min(5, Math.floor(progress * 6)) ? 0.2 : 0),
          ),
        );
        plot(
          rx,
          ry,
          rz * Math.cos(tilt) + y * Math.sin(tilt),
          GLYPHS[Math.floor(light * GLYPHS.length)],
        );
      }
    }
  }
  // A quiet perspective field gives the arch a place to land.
  for (let row = 34; row < HEIGHT - 2; row += 2) {
    const spread = (row - 28) * 1.9;
    for (let col = 0; col < WIDTH; col++) {
      const x = col - WIDTH / 2;
      if (Math.abs(x) < spread && (col + row) % 5 === 0 && cells[row * WIDTH + col] === " ") {
        cells[row * WIDTH + col] = ".";
      }
    }
  }
  return Array.from({ length: HEIGHT }, (_, row) =>
    cells.slice(row * WIDTH, (row + 1) * WIDTH).join(""),
  ).join("\n");
}

const INITIAL_FRAME = drawArc(0);

export default function RoadmapAscii({
  progress,
  active,
  still = false,
}: {
  progress: MotionValue<number>;
  active: number;
  still?: boolean;
}) {
  const frame = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let request = 0;
    let visible = true;
    const paint = () => {
      request = 0;
      element.textContent = drawArc(still ? 0 : progress.get());
    };
    const schedule = () => {
      if (visible && !request && !still) request = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) paint();
    });
    observer.observe(element);
    paint();
    const unsubscribe = progress.on("change", schedule);
    return () => {
      observer.disconnect();
      unsubscribe();
      cancelAnimationFrame(request);
    };
  }, [progress, still]);
  return (
    <div className="rm-ascii" aria-hidden="true">
      <div className="rm-ascii-register">
        <span>ARCWELL / SIGNAL ARCH</span>
        <span>+ &nbsp; +</span>
      </div>
      <pre ref={frame} className="rm-ascii-frame">
        {INITIAL_FRAME}
      </pre>
      <div className="rm-ascii-caption">
        <span className="rm-ascii-label">
          {roadmap.phases[active].number} / {roadmap.phases[active].short}
        </span>
        <span className="rm-ascii-signal">
          {roadmap.phases.map((phase, index) => (
            <i key={phase.id} className={index <= active ? "is-lit" : ""} />
          ))}
        </span>
      </div>
    </div>
  );
}
