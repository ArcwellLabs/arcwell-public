import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Fingerprint,
  RotateCcw,
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
  initialBook,
  mean,
  portfolioHistory,
  returns,
  rsi,
  simulatePaths,
  statistics,
  INVESTING_VIEWS,
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
import "./investing.css";

type Props = {
  view: string;
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
  markets: ["Markets", "Explore the sample asset universe and compare market behavior."],
  trading: ["Trading", "Price analysis, execution estimates and paper orders."],
  risk: ["Risk", "Concentration, correlations and portfolio stress tests."],
  quant: ["Quant Lab", "Explore factors, model surfaces and allocation trade-offs."],
  funding: ["Funding", "USDC funding routes and public wallet inspection."],
  ledger: ["Trading activity", "Paper fills, cash movements and position changes."],
};
export default function InvestingWorkspace(props: Props) {
  const { view, book, onNavigate } = props;
  const [title, description] = TITLES[view] || TITLES["portfolio"];
  const csv = () =>
    downloadCsv("arcwell-paper-positions.csv", [
      ["symbol", "quantity", "sample price USD", "value USD"],
      ...INSTRUMENTS.filter((a) => book.positions[a.symbol] > 0).map((a) => [
        a.symbol,
        book.positions[a.symbol],
        a.price,
        book.positions[a.symbol] * a.price,
      ]),
      ["USDC", book.cash, 1, book.cash],
    ]);
  return (
    <div className="quant-workspace">
      <header className="q-view-header">
        <div>
          <p className="q-eyebrow">
            [{String(INVESTING_VIEWS.indexOf(view) + 1).padStart(2, "0")}] ARCWELL control room
          </p>
          <h1>{title}</h1>
          <p className="q-description">{description}</p>
        </div>
        <div className="q-header-actions">
          <span className="q-badge">Synthetic market data</span>
          <button className="q-button" onClick={csv}>
            <Download size={13} /> Export positions
          </button>
        </div>
      </header>
      {props.storageNote ? (
        <p className="q-notice" role="status">
          {props.storageNote}
        </p>
      ) : null}
      {view === "portfolio" ? (
        <Portfolio {...props} />
      ) : view === "markets" ? (
        <Markets {...props} />
      ) : view === "trading" ? (
        <Trading {...props} />
      ) : view === "risk" ? (
        <Risk book={book} />
      ) : view === "quant" ? (
        <QuantLab />
      ) : view === "funding" ? (
        <Funding />
      ) : (
        <Ledger {...props} />
      )}
      <footer className="q-workspace-footer">
        <span>Research workspace / illustrative instruments</span>
        <button onClick={() => onNavigate("network")}>
          Arc Testnet tools <ArrowUpRight size={12} />
        </button>
        <span>
          Prices and charts are synthetic. No brokerage or execution provider is connected.
        </span>
      </footer>
    </div>
  );
}

function Portfolio({ book, onNavigate, setSymbol }: Props) {
  const [range, setRange] = useState("3M"),
    [chartMode, setChartMode] = useState("Value"),
    [insight, setInsight] = useState("Concentration"),
    [selected, setSelected] = useState("");
  const total = bookValue(book),
    holdings = INSTRUMENTS.filter((a) => book.positions[a.symbol] > 0);
  const all = useMemo(() => portfolioHistory(book), [book]),
    days = range === "1M" ? 22 : range === "3M" ? 66 : 253,
    history = all.slice(-days),
    stats = statistics(history.map((d) => d.value));
  const dd = drawdowns(history.map((d) => d.value));
  const data = history.map((d, i) => ({
    date: d.date.slice(5),
    value:
      chartMode === "Drawdown"
        ? dd[i] * 100
        : chartMode === "Indexed"
          ? (d.value / history[0].value) * 100
          : d.value,
    ...(chartMode === "Indexed"
      ? {
          SPY:
            (HISTORIES["SPY"].slice(-days)[i].close / HISTORIES["SPY"].slice(-days)[0].close) * 100,
        }
      : {}),
  }));
  const tech = holdings
    .filter((a) => a.sector === "Technology")
    .reduce((s, a) => s + book.positions[a.symbol] * a.price, 0);
  const sectors = [...new Set(holdings.map((a) => a.sector))].map((sector) => ({
    sector,
    value: holdings
      .filter((a) => a.sector === sector)
      .reduce((s, a) => s + book.positions[a.symbol] * a.price, 0),
  }));
  const analyst =
    insight === "Concentration"
      ? `${usd(tech)} (${((tech / total) * 100).toFixed(1)}%) is held directly in technology names. Equity funds may add further exposure; this sample does not include fund look-through data.`
      : insight === "Historical change"
        ? `The current holdings would have changed ${pct(stats.total * 100)} over this ${range} synthetic window. This is a fixed-holdings reconstruction, not your account’s realized return.`
        : `A 10% fall across equity holdings would change the account by ${usd(-holdings.filter((a) => !["Fixed income", "Commodities"].includes(a.sector)).reduce((s, a) => s + book.positions[a.symbol] * a.price * 0.1, 0))}. Cash and non-equity positions are held constant.`;
  return (
    <>
      <div className="q-stat-grid">
        <Stat
          label="Paper account value"
          value={usd(total, 2)}
          note={`${holdings.length} positions · snapshot prices`}
        />
        <Stat label="Available cash" value={usd(book.cash, 2)} note="USDC · paper balance" />
        <Stat
          label="Window volatility"
          value={`${(stats.volatility * 100).toFixed(1)}%`}
          note="Daily returns × √252"
        />
        <Stat
          label="Maximum drawdown"
          value={pct(stats.drawdown * 100)}
          note={`${range} synthetic reconstruction`}
        />
      </div>
      <div className="q-main-grid">
        <ChartPanel
          title="Portfolio history"
          meta="Current quantities applied to synthetic history"
          actions={
            <Segments
              value={range}
              values={["1M", "3M", "1Y"]}
              onChange={setRange}
              label="Portfolio history range"
            />
          }
        >
          <div className="q-chart-toolbar">
            <Segments
              value={chartMode}
              values={["Value", "Indexed", "Drawdown"]}
              onChange={setChartMode}
              label="Portfolio chart mode"
            />
            <span className="q-label">{pct(stats.total * 100)} / selected window</span>
          </div>
          <TimeChart
            data={data}
            keys={chartMode === "Indexed" ? ["value", "SPY"] : ["value"]}
            percent={chartMode === "Drawdown"}
            indexed={chartMode === "Indexed"}
          />
          <p className="q-footnote">
            {chartMode === "Indexed"
              ? "Both series start at 100. Solid: portfolio · dashed: SPY."
              : "Reconstruction excludes historical cash flows, fees and corporate actions."}
          </p>
        </ChartPanel>
        <ChartPanel title="Allocation" meta="Select a segment to inspect">
          <div className="q-allocation">
            <div
              className="q-donut"
              style={{
                background: `conic-gradient(${[
                  ...sectors.map((s) => ({
                    ...s,
                    color: ["#ededea", "#9a9aa2", "#566577", "#5d5650"][sectors.indexOf(s) % 4],
                  })),
                  { sector: "Cash", value: book.cash, color: "#292931" },
                ]
                  .map((s, i, list) => {
                    const start =
                      (list.slice(0, i).reduce((sum, x) => sum + x.value, 0) / total) * 100;
                    return `${s.color} ${start}% ${start + (s.value / total) * 100}%`;
                  })
                  .join(",")})`,
              }}
              role="img"
              aria-label="Portfolio allocation by asset sector"
            >
              <div>
                <span>Invested</span>
                <strong>{(((total - book.cash) / total) * 100).toFixed(1)}%</strong>
              </div>
            </div>
            <div className="q-allocation-list">
              {[...sectors, { sector: "Cash", value: book.cash }].map((s) => (
                <button
                  key={s.sector}
                  aria-pressed={selected === s.sector}
                  onClick={() => setSelected(s.sector)}
                >
                  <span>{s.sector}</span>
                  <strong>{((s.value / total) * 100).toFixed(1)}%</strong>
                </button>
              ))}
            </div>
            {selected ? (
              <p className="q-footnote" aria-live="polite">
                {selected}:{" "}
                {usd(
                  [...sectors, { sector: "Cash", value: book.cash }].find(
                    (s) => s.sector === selected,
                  )?.value || 0,
                )}
              </p>
            ) : null}
          </div>
        </ChartPanel>
      </div>
      <div className="q-main-grid">
        <ChartPanel
          title="Holdings"
          meta="Illustrative instruments · not live listings"
          actions={
            <button className="q-text-button" onClick={() => onNavigate("markets")}>
              Browse assets <ArrowUpRight size={13} />
            </button>
          }
        >
          <div className="q-table-scroll">
            <table className="q-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Units</th>
                  <th>Value</th>
                  <th>Weight</th>
                  <th>30D</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((a) => {
                  const change =
                    statistics(HISTORIES[a.symbol].slice(-31).map((c) => c.close)).total * 100;
                  return (
                    <tr key={a.symbol}>
                      <td>
                        <button
                          className="q-asset-link"
                          onClick={() => {
                            setSymbol(a.symbol);
                            onNavigate("trading");
                          }}
                        >
                          <span className="q-token">{a.symbol.slice(0, 1)}</span>
                          <span>
                            {a.name}
                            <small>{a.symbol}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        {book.positions[a.symbol].toLocaleString("en-US", {
                          maximumFractionDigits: 6,
                        })}
                      </td>
                      <td>{usd(book.positions[a.symbol] * a.price)}</td>
                      <td>{(((book.positions[a.symbol] * a.price) / total) * 100).toFixed(1)}%</td>
                      <td>{pct(change, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartPanel>
        <ChartPanel title="Portfolio analyst" meta="Calculated explanations · no language model">
          <div className="q-body">
            <Segments
              value={insight}
              values={["Concentration", "Historical change", "Stress"]}
              onChange={setInsight}
              label="Portfolio explanation"
            />
            <p className="q-analysis" aria-live="polite">
              {analyst}
            </p>
            <button className="q-button" onClick={() => onNavigate("risk")}>
              Open risk tools <ArrowUpRight size={13} />
            </button>
          </div>
        </ChartPanel>
      </div>
    </>
  );
}

function Markets({ setSymbol, onNavigate }: Props) {
  const [sector, setSector] = useState("All"),
    [sort, setSort] = useState("Return"),
    [query, setQuery] = useState(""),
    [days, setDays] = useState("30D");
  const universe = INSTRUMENTS.map((a) => ({
    ...a,
    stats: statistics(HISTORIES[a.symbol].slice(-Number.parseInt(days) - 1).map((c) => c.close)),
  }));
  const filtered = universe
    .filter(
      (a) =>
        (sector === "All" || a.sector === sector) &&
        `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Volatility"
        ? b.stats.volatility - a.stats.volatility
        : sort === "Name"
          ? a.name.localeCompare(b.name)
          : b.stats.total - a.stats.total,
    );
  return (
    <>
      <div className="q-toolbar">
        <label className="q-search">
          Search assets
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Symbol or company"
          />
        </label>
        <label>
          Sector
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            {["All", ...new Set(INSTRUMENTS.map((a) => a.sector))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {["Return", "Volatility", "Name"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Segments
          value={days}
          values={["30D", "90D", "252D"]}
          onChange={setDays}
          label="Market return window"
        />
      </div>
      <ChartPanel
        title="Market map"
        meta={`${filtered.length} instruments · shade = signed return over ${days}`}
      >
        <div className="q-market-map">
          {filtered.map((a) => (
            <button
              key={a.symbol}
              style={{
                background: chartShade(
                  a.stats.total >= 0,
                  Math.min(0.36, 0.07 + Math.abs(a.stats.total)),
                ),
              }}
              onClick={() => {
                setSymbol(a.symbol);
                onNavigate("trading");
              }}
            >
              <span className="q-label">{a.sector}</span>
              <strong>{a.symbol}</strong>
              <span>{pct(a.stats.total * 100, 1)}</span>
              <small>{a.name}</small>
              <ArrowUpRight size={14} />
            </button>
          ))}
          {!filtered.length ? <p className="q-body">No assets match these filters.</p> : null}
        </div>
      </ChartPanel>
      <div className="q-section-gap">
        <ChartPanel title="Asset comparison" meta="Synthetic return, volatility and drawdown">
          <div className="q-table-scroll">
            <table className="q-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Snapshot</th>
                  <th>{days} return</th>
                  <th>Ann. volatility</th>
                  <th>Max drawdown</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.symbol}>
                    <td>
                      {a.name}
                      <small>{a.symbol}</small>
                    </td>
                    <td>{usd(a.price, 2)}</td>
                    <td>{pct(a.stats.total * 100)}</td>
                    <td>{(a.stats.volatility * 100).toFixed(1)}%</td>
                    <td>{pct(a.stats.drawdown * 100)}</td>
                    <td>
                      <button
                        className="q-button"
                        onClick={() => {
                          setSymbol(a.symbol);
                          onNavigate("trading");
                        }}
                        aria-label={`Analyze ${a.symbol}`}
                      >
                        Analyze ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>
      </div>
    </>
  );
}

function Trading({ book, setBook, symbol, setSymbol, ready }: Props) {
  const [side, setSide] = useState("Buy"),
    [quantity, setQuantity] = useState("1"),
    [review, setReview] = useState(false),
    [message, setMessage] = useState(""),
    [detail, setDetail] = useState("Issuer"),
    [slippage, setSlippage] = useState(10);
  const asset = INSTRUMENTS.find((a) => a.symbol === symbol) || INSTRUMENTS[0],
    candles = HISTORIES[asset.symbol],
    units = Number(quantity),
    valid = Number.isFinite(units) && units > 0,
    amount = valid ? units * asset.price : 0;
  const oscillator = rsi(candles.map((c) => c.close));
  const rsiData = candles.slice(-60).map((c, i) => ({
    date: c.date.slice(5),
    RSI: oscillator[candles.length - 60 + i],
    overbought: 70,
    oversold: 30,
  }));
  function preview() {
    setMessage("");
    try {
      fillPaperOrder(
        book,
        asset.symbol,
        side === "Buy" ? "buy" : "sell",
        units,
        "preview",
        SNAPSHOT,
      );
      setReview(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Invalid order.");
    }
  }
  function execute() {
    try {
      const next = fillPaperOrder(
        book,
        asset.symbol,
        side === "Buy" ? "buy" : "sell",
        units,
        crypto.randomUUID(),
        new Date().toISOString(),
      );
      setBook(next);
      setReview(false);
      setMessage(
        `Paper ${side.toLowerCase()} filled: ${units} ${asset.symbol}. No real funds moved.`,
      );
    } catch (e) {
      setReview(false);
      setMessage(e instanceof Error ? e.message : "Order could not be filled.");
    }
  }
  const choose = (value: string) => {
    setSymbol(value);
    setReview(false);
    setMessage("");
  };
  return (
    <>
      <div className="q-instrument-strip">
        <label>
          Instrument
          <select
            aria-label="Trading instrument"
            value={asset.symbol}
            onChange={(e) => choose(e.target.value)}
          >
            {INSTRUMENTS.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} / {a.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="q-label">Snapshot price</span>
          <strong>{usd(asset.price, 2)}</strong>
        </div>
        <div>
          <span className="q-label">Paper position</span>
          <strong>{(book.positions[asset.symbol] || 0).toFixed(4)}</strong>
        </div>
        <span className="q-badge">Paper execution</span>
      </div>
      <div className="q-trade-grid">
        <div>
          <ChartPanel
            title={`${asset.symbol} / USDC`}
            meta="Synthetic daily candles · sample volume"
          >
            <CandleChart key={asset.symbol} candles={candles} symbol={asset.symbol} />
          </ChartPanel>
          <ChartPanel
            title="Relative strength index"
            meta="14-session simple-window RSI · 70 / 30 guides"
          >
            <MultiLineChart data={rsiData} keys={["RSI", "overbought", "oversold"]} height={150} />
          </ChartPanel>
        </div>
        <div>
          <ChartPanel title="Paper order" meta="Market order · snapshot fill">
            <div className="q-body">
              <Segments
                value={side}
                values={["Buy", "Sell"]}
                onChange={(v) => {
                  setSide(v);
                  setReview(false);
                }}
                label="Order side"
              />
              <label className="q-field">
                Quantity
                <input
                  aria-label="Order quantity"
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setReview(false);
                  }}
                />
              </label>
              <div className="q-keyvalue">
                <span>Price</span>
                <strong>{usd(asset.price, 2)}</strong>
              </div>
              <div className="q-keyvalue">
                <span>Order value</span>
                <strong>{usd(amount, 2)}</strong>
              </div>
              <div className="q-keyvalue">
                <span>Available cash</span>
                <strong>{usd(book.cash, 2)}</strong>
              </div>
              {review ? (
                <div className="q-review">
                  <p>
                    {side} {units} {asset.symbol} at {usd(asset.price, 2)} per unit. Fees are
                    excluded.
                  </p>
                  <button className="q-button q-primary" disabled={!ready} onClick={execute}>
                    Confirm paper {side.toLowerCase()}
                  </button>
                  <button className="q-text-button" onClick={() => setReview(false)}>
                    Edit order
                  </button>
                </div>
              ) : (
                <button
                  className="q-button q-primary q-full"
                  disabled={!ready || !valid}
                  onClick={preview}
                >
                  Review paper order <ArrowUpRight size={14} />
                </button>
              )}
              {message ? (
                <p className="q-notice" role="status">
                  {message}
                </p>
              ) : null}
              <p className="q-footnote">
                Saved only in this browser. No signatures, onchain transfers or brokerage orders.
              </p>
            </div>
          </ChartPanel>
          <ChartPanel title="Execution cost" meta="Hypothetical slippage estimate">
            <div className="q-body">
              <label className="q-field">
                Slippage assumption {slippage} bps
                <input
                  aria-label="Slippage assumption"
                  type="range"
                  min="0"
                  max="100"
                  value={slippage}
                  onChange={(e) => setSlippage(Number(e.target.value))}
                />
              </label>
              <div className="q-depth-bars">
                {[12, 25, 34, 48, 68, 87].map((v, i) => (
                  <div key={v} style={{ width: `${v}%`, opacity: 0.25 + i * 0.1 }} />
                ))}
              </div>
              <div className="q-keyvalue">
                <span>Estimated price impact</span>
                <strong>{usd((amount * slippage) / 10000, 2)}</strong>
              </div>
              <p className="q-footnote">
                Cost = order value × bps / 10,000. Diagram is illustrative depth, not an order book.
              </p>
            </div>
          </ChartPanel>
        </div>
      </div>
      <div className="q-section-gap">
        <ChartPanel
          title="Asset details"
          meta="Provider requirements and product mechanics"
          actions={
            <Segments
              value={detail}
              values={["Issuer", "Market quality", "Corporate actions"]}
              onChange={setDetail}
              label="Asset details"
            />
          }
        >
          <div className="q-body">
            {detail === "Issuer" ? (
              <div className="q-info-grid">
                {[
                  ["Issuer", "Not connected"],
                  ["Reserve report", "Issuer data required"],
                  ["Custodian", "Disclosure required"],
                  ["Redemption", "Provider terms required"],
                  ["Trading network", "Provider dependent"],
                  ["Eligibility", "Must be checked before listing"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="q-label">{k}</span>
                    <p>{v}</p>
                  </div>
                ))}
              </div>
            ) : detail === "Market quality" ? (
              <>
                <div className="q-info-grid">
                  <Stat
                    label="Sample reference"
                    value={usd(asset.price, 2)}
                    note="Synthetic snapshot"
                  />
                  <Stat label="Executable quote" value="Unavailable" note="No venue connected" />
                  <Stat label="Price freshness" value="Static" note="Not a live market feed" />
                </div>
                <p className="q-footnote">
                  A live implementation must distinguish underlying-market data, token prices and
                  executable quotes.
                </p>
              </>
            ) : (
              <p className="q-analysis">
                Dividend reinvestment and splits depend on the issuer’s token mechanics. The current
                paper account does not apply corporate actions. The live adapter must ingest event
                dates and balance multipliers before these figures can represent investment returns.
              </p>
            )}
          </div>
        </ChartPanel>
      </div>
    </>
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

function Ledger({ book, setBook, onNavigate }: Props) {
  const [side, setSide] = useState("All");
  const trades = book.trades.filter((t) => side === "All" || t.side === side.toLowerCase());
  let cash = 2740;
  const movements = [
    { day: 0, value: cash },
    ...[...book.trades].reverse().map((t, i) => {
      cash += t.side === "buy" ? -t.total : t.total;
      return { day: i + 1, value: cash };
    }),
  ];
  return (
    <>
      <div className="q-stat-grid">
        <Stat label="Paper fills" value={String(book.trades.length)} note="Saved in this browser" />
        <Stat
          label="Paper turnover"
          value={usd(book.trades.reduce((s, t) => s + t.total, 0))}
          note="Gross buys + sells"
        />
        <Stat label="Available cash" value={usd(book.cash, 2)} note="No settlement pending" />
        <Stat label="Execution" value="Simulated" note="No provider connected" />
      </div>
      <ChartPanel title="Cash after each fill" meta="Cumulative paper cash balance">
        <TimeChart data={movements} height={230} />
      </ChartPanel>
      <div className="q-section-gap">
        <ChartPanel
          title="Trade ledger"
          meta="Snapshot fills · no fees"
          actions={
            <Segments
              value={side}
              values={["All", "Buy", "Sell"]}
              onChange={setSide}
              label="Ledger side"
            />
          }
        >
          <div className="q-table-scroll">
            <table className="q-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Instrument</th>
                  <th>Units</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="q-inline">
                        {t.side === "buy" ? (
                          <ArrowDownLeft size={13} />
                        ) : (
                          <ArrowUpRight size={13} />
                        )}
                        {t.side}
                      </span>
                      <small>{new Date(t.at).toLocaleString()}</small>
                    </td>
                    <td>{t.symbol}</td>
                    <td>{t.quantity}</td>
                    <td>{usd(t.price, 2)}</td>
                    <td>{usd(t.total, 2)}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!trades.length ? (
            <div className="q-empty">
              <p>No {side === "All" ? "" : side.toLowerCase()} paper fills yet.</p>
              <button className="q-button" onClick={() => onNavigate("trading")}>
                Open trading ↗
              </button>
            </div>
          ) : null}
          <div className="q-body q-toolbar">
            <button
              className="q-button"
              onClick={() =>
                downloadCsv("arcwell-paper-trades.csv", [
                  ["id", "time", "symbol", "side", "quantity", "price", "total", "status"],
                  ...trades.map((t) => [
                    t.id,
                    t.at,
                    t.symbol,
                    t.side,
                    t.quantity,
                    t.price,
                    t.total,
                    t.status,
                  ]),
                ])
              }
            >
              <Download size={13} /> Export ledger
            </button>
            <button className="q-button" onClick={() => setBook(initialBook())}>
              <RotateCcw size={13} /> Reset paper account
            </button>
          </div>
        </ChartPanel>
      </div>
    </>
  );
}
