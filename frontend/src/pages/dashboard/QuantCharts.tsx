import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Maximize2, RotateCcw } from "lucide-react";
import {
  HISTORIES,
  INSTRUMENTS,
  correlation,
  downloadCsv,
  optionPrice,
  returns,
  sma,
  statistics,
} from "@/lib/quant";
import type { Candle } from "@/lib/quant";

import { chartShade, usd, pct } from "@/lib/quant-format";
export function Segments({
  value,
  values,
  onChange,
  label,
}: {
  value: string;
  values: string[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="q-segments" aria-label={label}>
      {values.map((v) => (
        <button type="button" key={v} aria-pressed={v === value} onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
    </div>
  );
}
export function ChartPanel({
  title,
  meta,
  actions,
  children,
  className = "",
}: {
  title: string;
  meta: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`q-panel ${className}`}>
      <header className="q-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{meta}</p>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
export function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="q-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
const tooltip = {
  backgroundColor: "#16161a",
  border: "1px solid #36363c",
  borderRadius: 10,
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 11,
  color: "#ededea",
};
export function TimeChart({
  data,
  keys = ["value"],
  height = 290,
  percent = false,
  indexed = false,
}: {
  data: Record<string, number | string | null>[];
  keys?: string[];
  height?: number;
  percent?: boolean;
  indexed?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <div
      className="q-chart"
      style={{ height }}
      role="img"
      aria-label={`${keys.join(" and ")} over ${data.length} observations`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 15, right: 18, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={`q-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ededea" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ededea" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#25252a" vertical={false} />
          <XAxis
            dataKey={data[0]?.["date"] !== undefined ? "date" : "day"}
            minTickGap={55}
            tick={{ fill: "#8b8b93", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={62}
            domain={["auto", "auto"]}
            tick={{ fill: "#8b8b93", fontSize: 10 }}
            tickFormatter={(v) =>
              percent
                ? `${Number(v).toFixed(1)}%`
                : Math.abs(v) > 999
                  ? `$${(v / 1000).toFixed(1)}k`
                  : Number(v).toFixed(1)
            }
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltip}
            labelStyle={{ color: "#8b8b93" }}
            formatter={(v: number) =>
              percent ? `${v.toFixed(2)}%` : indexed ? v.toFixed(2) : usd(v, 2)
            }
          />
          {keys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={["#ededea", "#a0a0a8", "#a6a6af"][i % 3]}
              strokeWidth={i ? 1.3 : 1.8}
              fill={i ? "transparent" : `url(#q-${id})`}
              strokeDasharray={i ? "4 4" : undefined}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function useWidth() {
  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([e]) => setWidth(Math.max(260, e.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function CandleChart({ candles, symbol }: { candles: Candle[]; symbol: string }) {
  const { ref, width } = useWidth(),
    [windowSize, setWindowSize] = useState("60D"),
    [overlay, setOverlay] = useState("SMA 20"),
    [hover, setHover] = useState<number | null>(null);
  const count = Number.parseInt(windowSize),
    data = candles.slice(-count),
    selected = data[Math.min(hover ?? data.length - 1, data.length - 1)];
  const average = sma(
    candles.map((c) => c.close),
    20,
  ).slice(-count);
  const lo =
      Math.min(...data.map((d) => d.low), ...average.filter((v): v is number => v !== null)) *
      0.995,
    hi =
      Math.max(...data.map((d) => d.high), ...average.filter((v): v is number => v !== null)) *
      1.005;
  const left = 58,
    right = width - 15,
    top = 23,
    bottom = 249,
    dx = (right - left) / data.length;
  const x = (i: number) => left + dx * (i + 0.5),
    y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const maxVolume = Math.max(...data.map((d) => d.volume));
  return (
    <div ref={ref}>
      <div className="q-chart-toolbar">
        <Segments
          value={windowSize}
          values={["30D", "60D", "120D"]}
          onChange={(v) => {
            setWindowSize(v);
            setHover(null);
          }}
          label="Candle range"
        />
        <Segments
          value={overlay}
          values={["SMA 20", "Price only"]}
          onChange={setOverlay}
          label="Price overlay"
        />
      </div>
      <div className="q-ohlc">
        <b>{symbol}</b>
        <span>{selected.date}</span>
        <span>O {selected.open.toFixed(2)}</span>
        <span>H {selected.high.toFixed(2)}</span>
        <span>L {selected.low.toFixed(2)}</span>
        <span>C {selected.close.toFixed(2)}</span>
      </div>
      <svg
        width="100%"
        height="335"
        viewBox={`0 0 ${width} 335`}
        className="q-candles"
        role="img"
        aria-label={`${symbol} OHLC candles and volume. Move across the chart to inspect.`}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHover(
            Math.max(0, Math.min(data.length - 1, Math.floor((e.clientX - rect.left - left) / dx))),
          );
        }}
        onPointerLeave={() => setHover(null)}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const value = lo + ((hi - lo) * i) / 4;
          return (
            <g key={i}>
              <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#25252a" />
              <text x={6} y={y(value) + 4}>
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <g key={d.day}>
            <line
              x1={x(i)}
              x2={x(i)}
              y1={y(d.high)}
              y2={y(d.low)}
              stroke={d.close >= d.open ? "#ededea" : "#737382"}
            />
            <rect
              x={x(i) - dx * 0.3}
              y={y(Math.max(d.open, d.close))}
              width={Math.max(1, dx * 0.6)}
              height={Math.max(1, Math.abs(y(d.open) - y(d.close)))}
              fill={d.close >= d.open ? "#ededea" : "#565662"}
            />
            <rect
              x={x(i) - dx * 0.3}
              y={302 - (d.volume / maxVolume) * 32}
              width={Math.max(1, dx * 0.6)}
              height={(d.volume / maxVolume) * 32}
              fill={d.close >= d.open ? "#777780" : "#33333c"}
            />
          </g>
        ))}
        {overlay === "SMA 20" ? (
          <polyline
            points={average.flatMap((v, i) => (v === null ? [] : [`${x(i)},${y(v)}`])).join(" ")}
            fill="none"
            stroke="#a3a3ad"
            strokeWidth="1.5"
          />
        ) : null}
        <text x={6} y={284}>
          VOL
        </text>
        <text x={left} y={325}>
          {data[0].date}
        </text>
        <text x={right} y={325} textAnchor="end">
          {data[data.length - 1].date}
        </text>
        {hover !== null ? (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={top}
              y2={304}
              stroke="#8b8b93"
              strokeDasharray="3 4"
            />
            <circle cx={x(hover)} cy={y(selected.close)} r="3" fill="#fff" />
          </g>
        ) : null}
      </svg>
      <label className="q-scrubber">
        Inspect candle
        <input
          aria-label="Inspect candle"
          type="range"
          min="0"
          max={data.length - 1}
          value={hover ?? data.length - 1}
          onChange={(e) => setHover(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

type Point = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  color: number;
  age: number;
  date?: string;
};
export function SpatialChart({ surface = false }: { surface?: boolean }) {
  const { ref, width } = useWidth(),
    [yaw, setYaw] = useState(-0.6),
    [pitch, setPitch] = useState(0.35),
    [zoom, setZoom] = useState(1),
    [day, setDay] = useState(252),
    [playing, setPlaying] = useState(false),
    [chosen, setChosen] = useState("NVDA"),
    [vol, setVol] = useState(30);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => setDay((d) => (d >= 252 ? 60 : d + 1)), 160);
    return () => clearInterval(interval);
  }, [playing]);
  const points: Point[] = useMemo(
    () =>
      surface
        ? Array.from({ length: 17 * 17 }, (_, i) => {
            const xi = i % 17,
              zi = Math.floor(i / 17),
              spot = 60 + xi * 5,
              days = 7 + zi * 22;
            return {
              id: String(i),
              label: `S ${spot} · ${days} days`,
              x: spot,
              y: optionPrice(spot, 100, days, vol / 100),
              z: days,
              color: optionPrice(spot, 100, days, vol / 100),
              age: 0,
            };
          })
        : INSTRUMENTS.flatMap((a) =>
            Array.from({ length: 6 }, (_, trail) => {
              const end = day - trail * 5,
                values = HISTORIES[a.symbol].slice(end - 30, end + 1).map((c) => c.close),
                stats = statistics(values),
                benchmark = HISTORIES["SPY"].slice(end - 30, end + 1).map((c) => c.close);
              return {
                id: `${a.symbol}-${trail}`,
                label: a.symbol,
                x: stats.volatility * 100,
                y: stats.total * 100,
                z: correlation(returns(values), returns(benchmark)),
                color: stats.total * 100,
                age: trail,
                date: HISTORIES[a.symbol][end].date,
              };
            }),
          ),
    [surface, day, vol],
  );
  const ranges = useMemo(
    () =>
      surface
        ? [
            [60, 140],
            [0, 60],
            [7, 359],
          ]
        : [
            [0, 70],
            [-25, 65],
            [-1, 1],
          ],
    [surface],
  );
  const project = (values: number[]) => {
    const [x, y, z] = values;
    const xx = x * Math.cos(yaw) + z * Math.sin(yaw),
      zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const yy = y * Math.cos(pitch) - zz * Math.sin(pitch),
      depth = y * Math.sin(pitch) + zz * Math.cos(pitch);
    const scale = (Math.min(width * 0.26, 145) * zoom * 3.8) / (3.8 + depth * 0.35);
    // Pixel precision is sufficient; libm can differ slightly between Node and browsers.
    return {
      x: Number((width / 2 + xx * scale).toFixed(3)),
      y: Number((211 - yy * scale).toFixed(3)),
      depth,
    };
  };
  const normalized = (p: Point) =>
    [p.x, p.y, p.z].map((v, i) => ((v - ranges[i][0]) / (ranges[i][1] - ranges[i][0])) * 2 - 1);
  const projected = points
    .map((p) => ({ ...p, ...{ screen: project(normalized(p)) } }))
    .sort((a, b) => b.screen.depth - a.screen.depth);
  const selected = points.find((p) => p.label === chosen && p.age === 0) || points[0];
  const labels = surface
    ? ["Spot USD", "Call USD", "Expiry days"]
    : ["Volatility %", "30D return %", "Correlation to SPY"];
  function line(a: number[], b: number[], key: string, bright = false) {
    const p = project(a),
      q = project(b);
    return (
      <line
        key={key}
        x1={p.x}
        y1={p.y}
        x2={q.x}
        y2={q.y}
        stroke={bright ? "#92929e" : "#30303a"}
        strokeWidth={bright ? 1 : 0.6}
      />
    );
  }
  return (
    <div ref={ref} className="q-spatial">
      <div className="q-chart-toolbar">
        <span className="q-label">
          {surface
            ? "European call · K $100 · r 4% · q 0%"
            : "96 observations · 16 assets · 6 dates"}
        </span>
        <div className="q-icon-actions">
          <button aria-label="Rotate left" onClick={() => setYaw((v) => v - 0.22)}>
            ↶
          </button>
          <button aria-label="Rotate right" onClick={() => setYaw((v) => v + 0.22)}>
            ↷
          </button>
          <button
            aria-label="Tilt view"
            onClick={() => setPitch((v) => (v > 0.8 ? -0.3 : v + 0.2))}
          >
            <Maximize2 size={14} />
          </button>
          <button
            aria-label="Reset 3D view"
            onClick={() => {
              setYaw(-0.6);
              setPitch(0.35);
              setZoom(1);
            }}
          >
            <RotateCcw size={14} />
          </button>
          <button
            aria-label="Export spatial data"
            onClick={() =>
              downloadCsv(surface ? "arcwell-option-surface.csv" : "arcwell-factor-cloud.csv", [
                [
                  "instrument",
                  ...labels,
                  surface ? "option value" : "momentum %",
                  "trail step",
                  "observation date",
                ],
                ...points.map((p) => [p.label, p.x, p.y, p.z, p.color, p.age, p.date || "model"]),
              ])
            }
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      <svg
        className="q-space-svg"
        role="img"
        aria-label={
          surface
            ? "Rotatable 3D Black-Scholes option price surface"
            : "Rotatable 3D factor cloud. Fourth variable is observation time; color also encodes momentum."
        }
        width="100%"
        height="425"
        viewBox={`0 0 ${width} 425`}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x,
            dy = e.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true;
          setYaw((v) => v + dx * 0.008);
          setPitch((v) => Math.max(-1.2, Math.min(1.2, v + dy * 0.008)));
          drag.current.x = e.clientX;
          drag.current.y = e.clientY;
        }}
        onPointerUp={(e) => {
          if (drag.current && !drag.current.moved && !surface) {
            const rect = e.currentTarget.getBoundingClientRect(),
              x = e.clientX - rect.left,
              y = e.clientY - rect.top;
            const nearest = [...projected]
              .filter((p) => p.age === 0)
              .sort(
                (a, b) =>
                  Math.hypot(a.screen.x - x, a.screen.y - y) -
                  Math.hypot(b.screen.x - x, b.screen.y - y),
              )[0];
            if (nearest && Math.hypot(nearest.screen.x - x, nearest.screen.y - y) < 28)
              setChosen(nearest.label);
          }
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {Array.from({ length: 9 }, (_, i) => {
          const v = -1 + i / 4;
          return (
            <g key={i}>
              {line([-1, -1, v], [1, -1, v], `gx${i}`)}
              {line([v, -1, -1], [v, -1, 1], `gz${i}`)}
            </g>
          );
        })}
        {line([-1, -1, -1], [1, -1, -1], "x", true)}
        {line([-1, -1, -1], [-1, 1, -1], "y", true)}
        {line([-1, -1, -1], [-1, -1, 1], "z", true)}
        {surface
          ? points.flatMap((p, i) => {
              const edges: ReactNode[] = [];
              if (i % 17 < 16)
                edges.push(line(normalized(p), normalized(points[i + 1]), `sx${i}`, true));
              if (i < 272) edges.push(line(normalized(p), normalized(points[i + 17]), `sz${i}`));
              return edges;
            })
          : null}
        {projected.map((p) => (
          <g key={p.id} opacity={surface ? 0.7 : 1 - p.age * 0.14}>
            <circle
              cx={p.screen.x}
              cy={p.screen.y}
              r={surface ? 1.5 : p.age ? 2 : p.label === chosen ? 7 : 4}
              fill={surface ? "#ededea" : p.color > 0 ? "#b7cad9" : "#a39a90"}
              stroke={!surface && p.label === chosen && !p.age ? "#fff" : "none"}
              strokeWidth={2}
            />
            <title>{`${p.label}: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`}</title>
            {!surface &&
            !p.age &&
            (p.label === chosen || ["SPY", "TBILL", "TSLA"].includes(p.label)) ? (
              <text x={p.screen.x + 10} y={p.screen.y - 7}>
                {p.label}
              </text>
            ) : null}
          </g>
        ))}
        {[
          [1.1, -1, -1],
          [-1, 1.15, -1],
          [-1, -1, 1.15],
        ].map((v, i) => {
          const p = project(v);
          return (
            <text
              key={i}
              x={Math.max(10, Math.min(width - 10, p.x))}
              y={Math.max(18, Math.min(403, p.y))}
              textAnchor={p.x > width / 2 ? "end" : "start"}
            >
              {labels[i]}
            </text>
          );
        })}
        {[0, 1, 2].flatMap((axis) =>
          [0, 0.5, 1].map((t) => {
            const v = [-1, -1, -1];
            v[axis] = -1 + 2 * t;
            const p = project(v),
              value = ranges[axis][0] + t * (ranges[axis][1] - ranges[axis][0]);
            return (
              <text key={`tick-${axis}-${t}`} x={p.x + 5} y={p.y - 5} opacity={0.65}>
                {value.toFixed(axis === 2 && !surface ? 1 : 0)}
              </text>
            );
          }),
        )}
        <text x="18" y="406">
          Drag to orbit · Use controls to rotate
        </text>
      </svg>
      <div className="q-spatial-controls">
        <label>
          Zoom
          <input
            type="range"
            min="65"
            max="120"
            value={zoom * 100}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
          />
        </label>
        {surface ? (
          <label>
            Volatility {vol}%
            <input
              aria-label="Surface volatility"
              type="range"
              min="10"
              max="65"
              value={vol}
              onChange={(e) => setVol(Number(e.target.value))}
            />
          </label>
        ) : (
          <>
            <label>
              Observation {HISTORIES["SPY"][day].date}
              <input
                aria-label="Observation time"
                type="range"
                min="60"
                max="252"
                value={day}
                onChange={(e) => {
                  setPlaying(false);
                  setDay(Number(e.target.value));
                }}
              />
            </label>
            <button className="q-button" onClick={() => setPlaying((v) => !v)}>
              {playing ? "Pause replay" : "Replay time"}
            </button>
          </>
        )}
      </div>
      {!surface ? (
        <div className="q-selected">
          <label>
            Asset
            <select
              aria-label="Selected cloud asset"
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
            >
              {INSTRUMENTS.map((a) => (
                <option key={a.symbol}>{a.symbol}</option>
              ))}
            </select>
          </label>
          <span>Vol {selected.x.toFixed(1)}%</span>
          <span>Return {pct(selected.y)}</span>
          <span>Corr {selected.z.toFixed(2)}</span>
          <span className="q-muted">Blue: positive · Taupe: negative</span>
        </div>
      ) : (
        <p className="q-footnote">
          Model prices only. No options are listed or traded. Assumes constant volatility and no
          dividends.
        </p>
      )}
    </div>
  );
}

export function CorrelationMatrix({
  symbols = INSTRUMENTS.slice(0, 8).map((a) => a.symbol),
  window = 60,
}: {
  symbols?: string[];
  window?: number;
}) {
  const [selected, setSelected] = useState<[string, string]>([
    symbols[0],
    symbols[1] || symbols[0],
  ]);
  const series = symbols.map((s) => returns(HISTORIES[s].slice(-window - 1).map((c) => c.close)));
  const i = symbols.indexOf(selected[0]),
    j = symbols.indexOf(selected[1]);
  return (
    <>
      <div className="q-matrix-wrap">
        <div
          className="q-matrix"
          style={{ gridTemplateColumns: `48px repeat(${symbols.length}, minmax(27px, 1fr))` }}
        >
          <span />
          {symbols.map((s) => (
            <span key={s} className="q-matrix-label">
              {s}
            </span>
          ))}
          {symbols.map((a, ai) => (
            <div className="q-matrix-row" key={a}>
              <span className="q-matrix-label">{a}</span>
              {symbols.map((b, bi) => {
                const value = correlation(series[ai], series[bi]);
                return (
                  <button
                    key={b}
                    aria-label={`${a} and ${b} correlation ${value.toFixed(2)}`}
                    aria-pressed={a === selected[0] && b === selected[1]}
                    onClick={() => setSelected([a, b])}
                    style={{
                      background: chartShade(value >= 0, 0.05 + Math.abs(value) * 0.55),
                    }}
                  >
                    {value.toFixed(1)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="q-selected" aria-live="polite">
        <strong>{selected.join(" / ")}</strong>
        <span>{correlation(series[Math.max(0, i)], series[Math.max(0, j)]).toFixed(3)}</span>
        <span className="q-muted">Pearson · {window} daily returns · sample data</span>
      </div>
    </>
  );
}

export function MultiLineChart({
  data,
  keys,
  height = 170,
}: {
  data: Record<string, number | string | null>[];
  keys: string[];
  height?: number;
}) {
  return (
    <div className="q-chart" style={{ height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 0, right: 20, top: 15, bottom: 5 }}>
          <CartesianGrid vertical={false} stroke="#25252a" />
          <XAxis
            dataKey="date"
            minTickGap={70}
            tick={{ fill: "#8b8b93", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={42}
            tick={{ fill: "#8b8b93", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip contentStyle={tooltip} formatter={(v: number) => v.toFixed(2)} />
          {keys.map((key, i) => (
            <Line
              key={key}
              dataKey={key}
              dot={false}
              stroke={["#ededea", "#a0a0a8"][i % 2]}
              strokeWidth={1.4}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
