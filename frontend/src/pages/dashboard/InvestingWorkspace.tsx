import { PrecisionPortfolio, PrecisionActivity, TradeTabs } from "./PrecisionInvesting";
import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Fingerprint,
  SlidersHorizontal,
} from "lucide-react";
import {
  INSTRUMENTS,
  HISTORIES,
  SNAPSHOT,
  allocationCloud,
  bookValue,
  correlation,
  downloadCsv,
  drawdowns,
  fillPaperOrder,
  mean,
  portfolioHistory,
  returns,
  rsi,
  simulatePaths,
  statistics,
} from "@/lib/quant";
import type { PaperBook } from "@/lib/quant";
import {
  CandleChart,
  ChartPanel,
  CorrelationMatrix,
  MultiLineChart,
  Segments,
  SpatialChart,
  Stat,
  TimeChart,
} from "./QuantCharts";
import { ArcBalance, ArcNetworkCheck } from "./ArcTools";
import { chartShade, pct, usd } from "@/lib/quant-format";
import { dashboardViewNumber, isDashboardViewEnabled } from "@/lib/dashboard-release";
import "./investing.css";
import AssetResearch from "./AssetResearch";
import TokenizedStocks from "./TokenizedStocks";
import AssetLogo from "@/components/AssetLogo";
import AssetSearchField from "@/components/AssetSearchField";

type Props = {
  view: string;
  initialAddress?: string;
  initialQuery?: string;
  onNavigate: (view: string) => void;
  symbol: string;
  setSymbol: (symbol: string) => void;
  book: PaperBook;
  setBook: Dispatch<SetStateAction<PaperBook>>;
  ready: boolean;
  storageNote: string;
};
const TITLES: Record<string, [string, string]> = {
  portfolio: ["Portfolio", "Holdings, allocations and historical scenarios."],
  markets: ["Markets", "Discover Arc assets and inspect sourced market data."],
  trading: ["Trade", "Price analysis, execution estimates and paper orders."],
  risk: ["Risk", "Concentration, correlations and portfolio stress tests."],
  quant: ["Quant Lab", "Explore factors, model surfaces and allocation trade-offs."],
  funding: ["Funding", "USDC funding routes and public wallet inspection."],
  ledger: ["Activity", "Paper fills, cash movements and position changes."],
};
export default function InvestingWorkspace(props: Props) {
  const { view, onNavigate } = props;
  const terminal = ["markets", "trading", "stocks"].includes(view);
  const title =
    view === "stocks" ? "Tokenized stocks" : view === "markets" ? "Market intelligence" : "Trading";
  return (
    <div className="quant-workspace">
      {terminal && (
        <>
          <header className="aw-page-heading">
            <h1>{title}</h1>
          </header>
          <TradeTabs view={view} onNavigate={onNavigate} />
        </>
      )}
      {props.storageNote && (
        <p className="aw-feedback" role="status">
          {props.storageNote}
        </p>
      )}
      {view === "portfolio" ? (
        <PrecisionPortfolio {...props} />
      ) : view === "trading" ? (
        <TokenizedStocks
          key={`${props.initialAddress || ""}:${props.initialQuery || ""}`}
          initialAddress={props.initialAddress}
          initialQuery={props.initialQuery}
        />
      ) : view === "markets" ? (
        <AssetResearch
          key={`${props.initialAddress || ""}:${props.initialQuery || ""}`}
          initialAddress={props.initialAddress}
          initialQuery={props.initialQuery}
        />
      ) : view === "stocks" ? (
        <TokenizedStocks
          key={`${props.initialAddress || ""}:${props.initialQuery || ""}`}
          initialAddress={props.initialAddress}
          initialQuery={props.initialQuery}
        />
      ) : view === "risk" ? (
        <Risk book={props.book} />
      ) : view === "quant" ? (
        <QuantLab />
      ) : view === "funding" ? (
        <Funding />
      ) : (
        <PrecisionActivity {...props} />
      )}
    </div>
  );
}

function Risk({ book }: { book: PaperBook }) {
  const [shock, setShock] = useState(-15),
    [sector, setSector] = useState("All equities"),
    [mu, setMu] = useState(7),
    [sigma, setSigma] = useState(20),
    [horizon, setHorizon] = useState(126),
    [window, setWindow] = useState("60D");
  const total = bookValue(book),
    history = portfolioHistory(book),
    stats = statistics(history.map((d) => d.value)),
    affected = INSTRUMENTS.filter((a) =>
      sector === "All equities"
        ? !["Fixed income", "Commodities"].includes(a.sector)
        : a.sector === sector,
    ),
    exposure = affected.reduce((s, a) => s + book.positions[a.symbol] * a.price, 0),
    impact = (exposure * shock) / 100;
  const paths = useMemo(
    () => simulatePaths(total, mu / 100, sigma / 100, horizon),
    [total, mu, sigma, horizon],
  );
  const distribution = returns(history.map((d) => d.value));
  const bins = Array.from({ length: 17 }, (_, i) => {
    const lower = -4 + i * 0.5;
    return {
      lower,
      count: distribution.filter((v) => v * 100 >= lower && v * 100 < lower + 0.5).length,
    };
  });
  const maxBin = Math.max(1, ...bins.map((b) => b.count));
  return (
    <>
      <div className="q-stat-grid">
        <Stat
          label="95% historical VaR"
          value={usd(total * stats.var95)}
          note="One-day loss quantile · synthetic"
        />
        <Stat
          label="Annualized volatility"
          value={`${(stats.volatility * 100).toFixed(1)}%`}
          note="253 observations · sample"
        />
        <Stat
          label="Sharpe ratio"
          value={stats.sharpe.toFixed(2)}
          note="Arithmetic mean · 4% risk-free"
        />
        <Stat
          label="Maximum drawdown"
          value={pct(stats.drawdown * 100)}
          note="Fixed-holdings reconstruction"
        />
      </div>
      <div className="q-main-grid">
        <ChartPanel
          title="Correlation matrix"
          meta="Select a pair to inspect its relationship"
          actions={
            <Segments
              value={window}
              values={["30D", "60D", "120D"]}
              onChange={setWindow}
              label="Correlation window"
            />
          }
        >
          <CorrelationMatrix window={Number.parseInt(window)} />
        </ChartPanel>
        <ChartPanel title="Stress test" meta="Single shock · other prices held constant">
          <div className="q-body">
            <label className="q-field">
              Exposure
              <select value={sector} onChange={(e) => setSector(e.target.value)}>
                {["All equities", "Technology", "Fixed income", "Commodities"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="q-field">
              Price shock {pct(shock, 0)}
              <input
                aria-label="Price shock"
                type="range"
                min="-50"
                max="50"
                value={shock}
                onChange={(e) => setShock(Number(e.target.value))}
              />
            </label>
            <div className="q-shock-value" aria-live="polite">
              {impact >= 0 ? "+" : "−"}
              {usd(Math.abs(impact))}
            </div>
            <div className="q-keyvalue">
              <span>Affected value</span>
              <strong>{usd(exposure)}</strong>
            </div>
            <div className="q-keyvalue">
              <span>After shock</span>
              <strong>{usd(total + impact)}</strong>
            </div>
            <p className="q-footnote">
              No correlations, second-order effects or liquidity costs are included in this shock.
            </p>
          </div>
        </ChartPanel>
      </div>
      <div className="q-main-grid">
        <ChartPanel
          title="Monte Carlo scenarios"
          meta="240 seeded paths · geometric Brownian motion"
        >
          <div className="q-chart-toolbar">
            <span className="q-label">P10 / Median / P90</span>
            <button
              className="q-text-button"
              onClick={() =>
                downloadCsv("arcwell-scenario-bands.csv", [
                  ["day", "p10 USD", "median USD", "p90 USD"],
                  ...paths.map((p) => [p.day, p.low, p.median, p.high]),
                ])
              }
            >
              Export bands <Download size={12} />
            </button>
          </div>
          <TimeChart data={paths} keys={["median", "low", "high"]} />
          <div className="q-model-controls">
            <label>
              Annual drift {mu}%
              <input
                aria-label="Simulation drift"
                type="range"
                min="-15"
                max="25"
                value={mu}
                onChange={(e) => setMu(Number(e.target.value))}
              />
            </label>
            <label>
              Volatility {sigma}%
              <input
                aria-label="Simulation volatility"
                type="range"
                min="1"
                max="60"
                value={sigma}
                onChange={(e) => setSigma(Number(e.target.value))}
              />
            </label>
            <label>
              Trading days {horizon}
              <input
                aria-label="Simulation horizon"
                type="range"
                min="21"
                max="252"
                step="21"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="q-footnote">
            Conditional simulations, not forecasts. Tail losses can exceed the displayed range.
          </p>
        </ChartPanel>
        <ChartPanel title="Return distribution" meta="Daily synthetic portfolio returns">
          <div
            className="q-histogram"
            role="img"
            aria-label="Histogram of daily portfolio percentage returns"
          >
            {bins.map((b) => (
              <div key={b.lower} title={`${b.lower}% to ${b.lower + 0.5}%: ${b.count} days`}>
                <span style={{ height: `${(b.count / maxBin) * 100}%` }} />
                <small>{[-4, 0, 4].includes(b.lower) ? `${b.lower}%` : ""}</small>
              </div>
            ))}
          </div>
          <div className="q-body">
            <div className="q-keyvalue">
              <span>Average daily return</span>
              <strong>{pct(mean(distribution) * 100, 3)}</strong>
            </div>
            <div className="q-keyvalue">
              <span>Negative days</span>
              <strong>
                {distribution.filter((r) => r < 0).length} / {distribution.length}
              </strong>
            </div>
            <p className="q-footnote">
              Bars cover −4% to +4.5%. Out-of-range observations:{" "}
              {distribution.filter((v) => v * 100 < -4 || v * 100 >= 4.5).length}.
            </p>
          </div>
        </ChartPanel>
      </div>
    </>
  );
}

function QuantLab() {
  const [tab, setTab] = useState("Factor cloud"),
    [picked, setPicked] = useState(0),
    [pair, setPair] = useState("AAPL");
  const cloud = useMemo(() => allocationCloud(), []),
    best = cloud[picked];
  const xs = cloud.map((p) => p.volatility),
    ys = cloud.map((p) => p.annualReturn),
    xlo = Math.min(...xs),
    xhi = Math.max(...xs),
    ylo = Math.min(...ys),
    yhi = Math.max(...ys),
    x = (v: number) => 65 + ((v - xlo) / (xhi - xlo)) * 620,
    y = (v: number) => 310 - ((v - ylo) / (yhi - ylo)) * 275;
  const frontier = [...cloud]
    .sort((a, b) => a.volatility - b.volatility)
    .filter(
      (p, i, list) =>
        i === 0 || p.annualReturn > Math.max(...list.slice(0, i).map((v) => v.annualReturn)),
    );
  const pairData = HISTORIES["NVDA"].slice(-120).map((c, i) => {
    const offset = HISTORIES["NVDA"].length - 120,
      a = HISTORIES["NVDA"].slice(Math.max(0, offset + i - 30), offset + i + 1).map((c) => c.close),
      b = HISTORIES[pair].slice(Math.max(0, offset + i - 30), offset + i + 1).map((c) => c.close);
    return {
      date: c.date.slice(5),
      ratio: c.close / HISTORIES[pair][offset + i].close,
      correlation: correlation(returns(a), returns(b)),
    };
  });
  return (
    <>
      <div className="q-toolbar">
        <Segments
          value={tab}
          values={["Factor cloud", "Option surface", "Allocations", "Pairs"]}
          onChange={setTab}
          label="Quant research tool"
        />
        <span className="q-label">Local calculations · exportable inputs</span>
      </div>
      {tab === "Factor cloud" ? (
        <ChartPanel
          title="4D factor explorer"
          meta="X volatility · Y return · Z correlation · time replay"
        >
          <SpatialChart key="factor" />
        </ChartPanel>
      ) : tab === "Option surface" ? (
        <ChartPanel
          title="3D option price surface"
          meta="Black-Scholes model · spot × expiry × call value"
        >
          <SpatialChart key="surface" surface />
        </ChartPanel>
      ) : tab === "Allocations" ? (
        <div className="q-main-grid">
          <ChartPanel
            title="Allocation opportunity set"
            meta="240 long-only mixes · NVDA / AAPL / SPY / TBILL"
          >
            <svg
              className="q-frontier"
              viewBox="0 0 740 365"
              role="img"
              aria-label="Annualized volatility against annualized arithmetic return for sampled portfolios"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <g key={i}>
                  <line x1="65" x2="685" y1={35 + i * 68.75} y2={35 + i * 68.75} stroke="#25252a" />
                  <text x="8" y={39 + i * 68.75}>
                    {(yhi - ((yhi - ylo) * i) / 4).toFixed(1)}%
                  </text>
                  <text x={65 + i * 155} y="332">
                    {(xlo + ((xhi - xlo) * i) / 4).toFixed(1)}%
                  </text>
                </g>
              ))}
              {cloud.map((p, i) => (
                <circle
                  key={p.id}
                  cx={x(p.volatility)}
                  cy={y(p.annualReturn)}
                  r={i === picked ? 6 : 3}
                  fill={i === picked ? "#fff" : "#626f7f"}
                  opacity={i === picked ? 1 : 0.55}
                  onClick={() => setPicked(i)}
                >
                  <title>
                    {p.id}: vol {p.volatility.toFixed(1)}%, return {p.annualReturn.toFixed(1)}%
                  </title>
                </circle>
              ))}
              <polyline
                points={frontier.map((p) => `${x(p.volatility)},${y(p.annualReturn)}`).join(" ")}
                stroke="#ededea"
                fill="none"
                strokeWidth="1.5"
              />
              <text x="310" y="356">
                Annualized volatility (%)
              </text>
              <text x="65" y="18">
                Annualized return (%)
              </text>
            </svg>
            <p className="q-footnote">
              Line joins non-dominated sampled mixes. It is not an optimized efficient frontier.
              Assumes daily rebalancing and no costs.
            </p>
          </ChartPanel>
          <ChartPanel title="Selected allocation" meta="Inspect weights and historical estimates">
            <div className="q-body">
              <label className="q-field">
                Portfolio sample
                <input
                  aria-label="Allocation sample"
                  type="range"
                  min="0"
                  max="239"
                  value={picked}
                  onChange={(e) => setPicked(Number(e.target.value))}
                />
              </label>
              {best.weights.map((w, i) => (
                <div key={i} className="q-allocation-weight">
                  <span>{INSTRUMENTS[i].symbol}</span>
                  <div>
                    <i style={{ width: `${w * 100}%` }} />
                  </div>
                  <b>{(w * 100).toFixed(1)}%</b>
                </div>
              ))}
              <div className="q-keyvalue">
                <span>Ann. return</span>
                <strong>{pct(best.annualReturn)}</strong>
              </div>
              <div className="q-keyvalue">
                <span>Ann. volatility</span>
                <strong>{best.volatility.toFixed(2)}%</strong>
              </div>
              <button
                className="q-button q-full"
                onClick={() =>
                  downloadCsv("arcwell-allocation-samples.csv", [
                    ["sample", "NVDA", "AAPL", "SPY", "TBILL", "annualReturn %", "volatility %"],
                    ...cloud.map((p) => [p.id, ...p.weights, p.annualReturn, p.volatility]),
                  ])
                }
              >
                Export all samples <Download size={12} />
              </button>
            </div>
          </ChartPanel>
        </div>
      ) : (
        <>
          <div className="q-toolbar">
            <label>
              Compare NVDA with
              <select
                aria-label="Pairs instrument"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
              >
                {INSTRUMENTS.filter((a) => a.symbol !== "NVDA").map((a) => (
                  <option key={a.symbol}>{a.symbol}</option>
                ))}
              </select>
            </label>
          </div>
          <ChartPanel
            title={`NVDA / ${pair} price ratio`}
            meta="120 observations · synthetic daily closing prices"
          >
            <MultiLineChart data={pairData} keys={["ratio"]} height={280} />
          </ChartPanel>
          <div className="q-section-gap">
            <ChartPanel title="Rolling correlation" meta="30 daily returns · Pearson correlation">
              <MultiLineChart data={pairData} keys={["correlation"]} height={210} />
            </ChartPanel>
          </div>
        </>
      )}
      <div className="q-methods">
        <SlidersHorizontal size={15} />
        <p>
          Research inputs are deterministic sample prices. Return and risk estimates are historical
          calculations on those inputs. Tools do not place orders.
        </p>
      </div>
    </>
  );
}

function Funding() {
  const [source, setSource] = useState("Base"),
    [amount, setAmount] = useState(500),
    [step, setStep] = useState(0);
  const steps = ["Review source", "Approve deposit", "Await confirmation", "Balance available"];
  return (
    <>
      <ChartPanel
        title="Funding route"
        meta="Gateway concept · no transfer submitted"
        actions={<span className="q-badge">Route simulator</span>}
      >
        <div className="q-toolbar q-pad">
          <label>
            Source network
            <select
              aria-label="Funding source"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setStep(0);
              }}
            >
              {["Base", "Ethereum", "Arbitrum"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Amount (USDC)
            <input
              aria-label="Funding amount"
              type="number"
              min="1"
              max="100000"
              value={amount}
              onChange={(e) => {
                setAmount(Math.max(0, Math.min(100000, Number(e.target.value))));
                setStep(0);
              }}
            />
          </label>
        </div>
        <div className="q-route-map">
          <div className={`q-route-node ${step > 0 ? "is-active" : ""}`}>
            <span className="q-token">{source[0]}</span>
            <strong>{source}</strong>
            <small>{amount.toLocaleString()} USDC</small>
          </div>
          <div className={`q-route-line ${step > 1 ? "is-active" : ""}`}>
            <span>Deposit + confirm</span>
            <i />
          </div>
          <div className={`q-route-node ${step > 1 ? "is-active" : ""}`}>
            <span className="q-token">G</span>
            <strong>Gateway</strong>
            <small>Unified balance</small>
          </div>
          <div className={`q-route-line ${step > 2 ? "is-active" : ""}`}>
            <span>Authorized transfer</span>
            <i />
          </div>
          <div className={`q-route-node ${step > 2 ? "is-active" : ""}`}>
            <span className="q-token">A</span>
            <strong>Arc Testnet</strong>
            <small>Destination</small>
          </div>
        </div>
        <div className="q-funding-steps">
          {steps.map((s, i) => (
            <button key={s} aria-pressed={i === step} onClick={() => setStep(i)}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s}
            </button>
          ))}
        </div>
        <div className="q-selected">
          <strong>{steps[step]}</strong>
          <span className="q-muted">
            {
              [
                "Check network, amount and fees before authorizing.",
                "The wallet would ask you to approve the deposit.",
                "A pending deposit cannot be counted as spendable cash.",
                "Only confirmed funds enter the available balance.",
              ][step]
            }
          </span>
          <button className="q-button" onClick={() => setStep((v) => (v === 3 ? 0 : v + 1))}>
            {step === 3 ? "Restart preview" : "Next step"}
          </button>
        </div>
        <p className="q-footnote">
          Production support and fees require provider verification. This diagram does not move
          funds or change the paper account.
        </p>
      </ChartPanel>
      <div className="q-main-grid">
        <div className="q-original-tools">
          <ArcBalance />
        </div>
        <ChartPanel title="Wallet access" meta="Passkey flow · planned integration">
          <div className="q-body">
            <Fingerprint size={42} strokeWidth={1} className="q-wallet-icon" />
            <h3>User-controlled approvals</h3>
            <p className="q-analysis">
              A connected wallet would approve each transfer. Passkey sign-in, recovery and
              sponsored fees require a wallet-provider integration.
            </p>
            <div className="q-keyvalue">
              <span>Signing provider</span>
              <strong>Not connected</strong>
            </div>
            <div className="q-keyvalue">
              <span>Custody</span>
              <strong>No keys stored</strong>
            </div>
            <div className="q-keyvalue">
              <span>Current capability</span>
              <strong>Read-only RPC</strong>
            </div>
          </div>
        </ChartPanel>
      </div>
      <div className="q-original-tools q-section-gap">
        <ArcNetworkCheck />
      </div>
    </>
  );
}
