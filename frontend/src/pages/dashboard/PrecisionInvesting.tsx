import { useState, type Dispatch, type SetStateAction } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ChevronLeft,
  Download,
  Search,
  Check,
  History,
  Wallet,
  Info,
} from "lucide-react";
import AssetLogo from "@/components/AssetLogo";
import {
  INSTRUMENTS,
  HISTORIES,
  SNAPSHOT,
  bookValue,
  portfolioHistory,
  downloadCsv,
  fillPaperOrder,
  type PaperBook,
} from "@/lib/quant";
import { usd, pct } from "@/lib/quant-format";
import { CandleChart, Segments, TimeChart } from "./QuantCharts";
import { useWorkspacePreferences } from "./WorkspacePreferences";

export type InvestingProps = {
  book: PaperBook;
  setBook: Dispatch<SetStateAction<PaperBook>>;
  symbol: string;
  setSymbol: (symbol: string) => void;
  onNavigate: (view: string) => void;
  ready: boolean;
};
const ranges = { "1W": 5, "1M": 22, "3M": 66, "1Y": 253 };
const amount = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
export function exportPositions(book: PaperBook) {
  downloadCsv("arcwell-positions.csv", [
    ["symbol", "quantity", "reference price USD", "value USD"],
    ...INSTRUMENTS.filter((a) => book.positions[a.symbol] > 0).map((a) => [
      a.symbol,
      book.positions[a.symbol],
      a.price,
      book.positions[a.symbol] * a.price,
    ]),
    ["USD", book.cash, 1, book.cash],
  ]);
}
export function TradeTabs({
  view,
  onNavigate,
}: {
  view: string;
  onNavigate: (view: string) => void;
}) {
  return (
    <nav className="aw-trade-tabs" aria-label="Trade workspace">
      {[
        ["stocks", "Tokenized stocks"],
        ["markets", "Arc research"],
        ["trading", "Trading"],
      ].map(([id, label]) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={view === id ? "page" : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="aw-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PrecisionPortfolio({ book, setSymbol, onNavigate }: InvestingProps) {
  const { preferences } = useWorkspacePreferences();
  const [range, setRange] = useState("1M");
  const [selected, setSelected] = useState("AAPL");
  const [query, setQuery] = useState("");
  const holdings = INSTRUMENTS.filter((a) => book.positions[a.symbol] > 0);
  const asset = holdings.find((a) => a.symbol === selected) || holdings[0] || INSTRUMENTS[0];
  const total = bookValue(book);
  const days = ranges[range as keyof typeof ranges];
  const history = HISTORIES[asset.symbol].slice(-days);
  const accountHistory = portfolioHistory(book).slice(-days);
  const baseline = accountHistory[0]?.value || total;
  const change = total - baseline;
  const priceChange = asset.price - history[0].close;
  const visible = holdings.filter((a) =>
    `${a.symbol} ${a.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  const allocations = [
    ...holdings.map((a) => ({ label: a.symbol, value: a.price * book.positions[a.symbol] })),
    { label: "Cash", value: book.cash },
  ];
  return (
    <div className="aw-portfolio">
      <header className="aw-page-heading">
        <h1>Portfolio</h1>
      </header>
      <div className="aw-portfolio-summary">
        <div className="aw-total">
          <span className="aw-sr-only">Portfolio value</span>
          {usd(total, 2)}
        </div>
        <div>
          <strong>
            {change >= 0 ? "+" : ""}
            {usd(change, 2)} <small>({pct(baseline ? (change / baseline) * 100 : 0)})</small>
          </strong>
          <span>{range} holdings change</span>
        </div>
        <div>
          <strong>{usd(book.cash, 2)}</strong>
          <span>Cash balance</span>
        </div>
        <div className="aw-actions">
          <button
            className="aw-button aw-primary"
            onClick={() => {
              setSymbol(asset.symbol);
              onNavigate("trading");
            }}
          >
            Trade <ArrowUpRight size={16} />
          </button>
          <button className="aw-button" onClick={() => exportPositions(book)}>
            <Download size={15} />
            Export
          </button>
        </div>
      </div>
      <div className="aw-portfolio-grid">
        <section className="aw-panel aw-holdings" aria-label="Holdings">
          <header className="aw-panel-heading">
            <h2>
              Holdings <small>{holdings.length}</small>
            </h2>
            <span>Value</span>
          </header>
          <label className="aw-inline-search">
            <Search size={15} />
            <input
              aria-label="Search holdings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a holding…"
            />
          </label>
          <div className="aw-holding-list">
            {visible.map((a) => (
              <button
                className="aw-holding"
                key={a.symbol}
                aria-pressed={asset.symbol === a.symbol}
                onClick={() => setSelected(a.symbol)}
              >
                <AssetLogo symbol={a.symbol} />
                <span>
                  <strong>{a.symbol}</strong>
                  <small>{a.name}</small>
                </span>
                <span className="aw-holding-value">
                  <strong>{usd(a.price * book.positions[a.symbol], 2)}</strong>
                  <small>
                    {amount(book.positions[a.symbol])} units · {usd(a.price, 2)}
                  </small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
            {!visible.length && (
              <p className="aw-empty-small">
                {holdings.length ? "No matching holdings." : "Your positions will appear here."}
              </p>
            )}
            <div className="aw-holding aw-cash">
              <Wallet size={28} />
              <span>
                <strong>USD</strong>
                <small>Cash balance</small>
              </span>
              <strong className="aw-holding-value">{usd(book.cash, 2)}</strong>
            </div>
          </div>
          <div className="aw-allocation">
            <h2>Allocation</h2>
            <div className="aw-allocation-bar" role="img" aria-label="Portfolio allocation">
              {allocations.map((a, i) => (
                <span
                  key={a.label}
                  title={`${a.label}: ${pct(total ? (a.value / total) * 100 : 0)}`}
                  style={{ flexGrow: a.value, backgroundColor: `hsl(240 2% ${90 - i * 13}%)` }}
                />
              ))}
            </div>
            <dl>
              {allocations.map((a, i) => (
                <div key={a.label}>
                  <dt>
                    <span style={{ backgroundColor: `hsl(240 2% ${90 - i * 13}%)` }} />
                    {a.label}
                  </dt>
                  <dd>{(total ? (a.value / total) * 100 : 0).toFixed(1)}%</dd>
                  <dd>{usd(a.value, 2)}</dd>
                </div>
              ))}
            </dl>
            <div className="aw-allocation-total">
              <span>Total value</span>
              <strong>{usd(total, 2)}</strong>
            </div>
          </div>
        </section>
        <section className="aw-panel aw-asset-detail" aria-label="Selected holding">
          <header className="aw-asset-heading">
            <AssetLogo symbol={asset.symbol} />
            <div>
              <h2>{asset.name}</h2>
              <p>
                {asset.symbol} <span>│</span> {amount(book.positions[asset.symbol] || 0)} units
              </p>
            </div>
            <div className="aw-asset-price">
              <span>Reference price</span>
              <strong>{usd(asset.price, 2)}</strong>
              <small>
                {pct((priceChange / history[0].close) * 100)} ({range})
              </small>
            </div>
          </header>
          <div className="aw-chart-controls">
            <Segments
              value={range}
              values={Object.keys(ranges)}
              onChange={setRange}
              label="Portfolio chart range"
            />
            <span>
              {history[0].date} — {history.at(-1)?.date}
            </span>
          </div>
          {preferences.chart === "Candles" ? (
            <CandleChart
              key={asset.symbol}
              candles={HISTORIES[asset.symbol]}
              symbol={asset.symbol}
            />
          ) : (
            <TimeChart
              data={history.map((c) => ({ date: c.date.slice(5), value: c.close }))}
              height={330}
            />
          )}
          <section className="aw-position-details">
            <h2>Position details</h2>
            <Facts
              items={[
                ["Quantity", amount(book.positions[asset.symbol] || 0)],
                ["Market value", usd((book.positions[asset.symbol] || 0) * asset.price, 2)],
                [
                  "Portfolio weight",
                  `${(total ? (((book.positions[asset.symbol] || 0) * asset.price) / total) * 100 : 0).toFixed(1)}%`,
                ],
              ]}
            />
          </section>
          <div className="aw-panel-footnote">
            <Info size={14} />
            <span>Select a holding to inspect its position.</span>
            <button onClick={() => onNavigate("settings")}>
              Data sources <ArrowUpRight size={12} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PrecisionTrading({
  book,
  setBook,
  symbol,
  setSymbol,
  ready,
  onNavigate,
}: InvestingProps) {
  const [side, setSide] = useState("Buy");
  const [quantity, setQuantity] = useState("1");
  const [review, setReview] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const asset = INSTRUMENTS.find((a) => a.symbol === symbol) || INSTRUMENTS[0];
  const candles = HISTORIES[asset.symbol];
  const latest = candles.at(-1)!;
  const units = Number(quantity);
  const value = Number.isFinite(units) && units > 0 ? units * asset.price : 0;
  const choose = (id: string) => {
    setSymbol(id);
    setReview(false);
    setMessage("");
  };
  const order = () => {
    try {
      const next = fillPaperOrder(
        book,
        asset.symbol,
        side === "Buy" ? "buy" : "sell",
        units,
        crypto.randomUUID(),
        new Date().toISOString(),
      );
      if (!review) {
        setReview(true);
        setMessage("");
        return;
      }
      setBook(next);
      setReview(false);
      setMessage(`${side} recorded: ${amount(units)} ${asset.symbol}. View the entry in Activity.`);
    } catch (e) {
      setReview(false);
      setMessage(
        (e instanceof Error ? e.message : "Unable to record order.")
          .replaceAll("paper ", "")
          .replaceAll("Paper ", ""),
      );
    }
  };
  const holdings = INSTRUMENTS.filter((a) => book.positions[a.symbol] > 0);
  return (
    <div className="aw-trading-grid">
      <div className="aw-trading-main">
        <section className="aw-panel">
          <div className="aw-instrument-picker">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find an instrument…"
              aria-label="Search instruments"
            />
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
          </div>
          {query && (
            <div className="aw-instrument-matches">
              {INSTRUMENTS.filter((a) =>
                `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()),
              ).map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => {
                    choose(a.symbol);
                    setQuery("");
                  }}
                >
                  <AssetLogo symbol={a.symbol} />
                  {a.symbol}
                  <span>{a.name}</span>
                </button>
              ))}
              {!INSTRUMENTS.some((a) =>
                `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()),
              ) && <p>No matching instruments.</p>}
            </div>
          )}
          <div className="aw-market-header">
            <header className="aw-asset-heading">
              <AssetLogo symbol={asset.symbol} />
              <div>
                <h2>{asset.symbol}</h2>
                <p>{asset.name}</p>
              </div>
              <div className="aw-asset-price">
                <strong>{usd(asset.price, 2)}</strong>
                <small>{pct((latest.close / latest.open - 1) * 100)}</small>
              </div>
            </header>
            <div className="aw-market-facts">
              <Facts
                items={[
                  ["Open", usd(latest.open, 2)],
                  ["High", usd(latest.high, 2)],
                  ["Low", usd(latest.low, 2)],
                  ["Volume", amount(latest.volume)],
                ]}
              />
            </div>
          </div>
          <CandleChart key={asset.symbol} candles={candles} symbol={asset.symbol} />
        </section>
        <section className="aw-panel aw-position-table">
          <header className="aw-panel-heading">
            <h2>Positions</h2>
            <button onClick={() => onNavigate("portfolio")}>
              Portfolio <ArrowUpRight size={14} />
            </button>
          </header>
          <div className="aw-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Market value</th>
                  <th>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((a) => (
                  <tr key={a.symbol}>
                    <td>
                      <button className="aw-table-asset" onClick={() => choose(a.symbol)}>
                        <AssetLogo symbol={a.symbol} />
                        <span>
                          <strong>{a.symbol}</strong>
                          <small>{a.name}</small>
                        </span>
                      </button>
                    </td>
                    <td>{amount(book.positions[a.symbol])}</td>
                    <td>{usd(a.price, 2)}</td>
                    <td>{usd(book.positions[a.symbol] * a.price, 2)}</td>
                    <td>
                      {(bookValue(book)
                        ? ((book.positions[a.symbol] * a.price) / bookValue(book)) * 100
                        : 0
                      ).toFixed(1)}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!holdings.length && <p className="aw-empty-small">No open positions.</p>}
        </section>
      </div>
      <aside className="aw-order-column">
        <section className="aw-panel aw-order">
          <h2>{review ? "Review order" : "Order"}</h2>
          <Segments
            value={side}
            values={["Buy", "Sell"]}
            onChange={(v) => {
              setSide(v);
              setReview(false);
              setMessage("");
            }}
            label="Order side"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              order();
            }}
          >
            <div className="aw-form-row">
              <span>Order type</span>
              <strong>Market</strong>
            </div>
            <label className="aw-form-row">
              Quantity
              <input
                type="number"
                min="0.000001"
                step="0.000001"
                value={quantity}
                required
                aria-label="Order quantity"
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setReview(false);
                  setMessage("");
                }}
              />
            </label>
            <Facts
              items={[
                ["Reference price", usd(asset.price, 2)],
                ["Order value", usd(value, 2)],
                ["Available cash", usd(book.cash, 2)],
              ]}
            />
            {review && (
              <div className="aw-review-note">
                <Info size={16} />
                <p>
                  This records {side.toLowerCase()} {amount(units)} {asset.symbol} in this device’s
                  workspace ledger. It does not send an order to a broker or move funds.{" "}
                  <button type="button" onClick={() => onNavigate("stocks")}>
                    Open wallet trading <ArrowUpRight size={12} />
                  </button>
                </p>
              </div>
            )}
            <button
              className="aw-button aw-primary aw-full"
              disabled={!ready || value <= 0}
              type="submit"
            >
              {review ? "Record order" : "Review order"}
              <ArrowUpRight size={16} />
            </button>
            {review && (
              <button type="button" className="aw-text-button" onClick={() => setReview(false)}>
                Edit order
              </button>
            )}
          </form>
          {message && (
            <p className="aw-feedback" role="status">
              {message}
            </p>
          )}
          <button className="aw-text-button" onClick={() => onNavigate("settings")}>
            Data & execution details <ArrowUpRight size={12} />
          </button>
        </section>
        <section className="aw-panel aw-your-position">
          <h2>Your position</h2>
          <div className="aw-asset-heading">
            <AssetLogo symbol={asset.symbol} />
            <div>
              <strong>{asset.symbol}</strong>
              <p>{asset.name}</p>
            </div>
          </div>
          <Facts
            items={[
              ["Quantity", amount(book.positions[asset.symbol] || 0)],
              ["Market value", usd((book.positions[asset.symbol] || 0) * asset.price, 2)],
            ]}
          />
        </section>
      </aside>
    </div>
  );
}

export function PrecisionActivity({ book, onNavigate }: InvestingProps) {
  const { preferences } = useWorkspacePreferences();
  const [query, setQuery] = useState("");
  const [side, setSide] = useState("All");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState("");
  const trades = book.trades.filter(
    (t) =>
      (side === "All" || side.toLowerCase() === t.side) &&
      `${t.symbol} ${t.id} ${INSTRUMENTS.find((a) => a.symbol === t.symbol)?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const currentPage = Math.min(page, Math.max(0, Math.ceil(trades.length / 6) - 1));
  const rows = trades.slice(currentPage * 6, currentPage * 6 + 6);
  const active = trades.find((t) => t.id === selected) || rows[0];
  const formatDate = (date: string) =>
    Number.isFinite(Date.parse(date))
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: preferences.timezone,
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(date))
      : "Time unavailable";
  const exportActivity = () =>
    downloadCsv("arcwell-activity.csv", [
      ["id", "time", "symbol", "side", "quantity", "price", "total", "execution"],
      ...trades.map((t) => [
        t.id,
        t.at,
        t.symbol,
        t.side,
        t.quantity,
        t.price,
        t.total,
        "workspace ledger",
      ]),
    ]);
  return (
    <div>
      <header className="aw-page-heading">
        <div>
          <h1>Activity</h1>
          <p>Every move, in one place.</p>
        </div>
        <button className="aw-button aw-primary" onClick={exportActivity}>
          <Download size={16} />
          Export activity
        </button>
      </header>
      <div className="aw-activity-summary">
        <Facts
          items={[
            ["Transactions", String(book.trades.length)],
            [
              "Volume",
              usd(
                book.trades.reduce((sum, t) => sum + t.total, 0),
                2,
              ),
            ],
            ["Available cash", usd(book.cash, 2)],
          ]}
        />
      </div>
      <div className="aw-activity-grid">
        <section className="aw-panel aw-ledger">
          <div className="aw-ledger-toolbar">
            <label className="aw-inline-search">
              <Search size={16} />
              <input
                aria-label="Search activity"
                placeholder="Search asset or transaction"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <Segments
              value={side}
              values={["All", "Buy", "Sell"]}
              onChange={(v) => {
                setSide(v);
                setPage(0);
              }}
              label="Activity type"
            />
          </div>
          <div className="aw-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>
                    <span className="aw-sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} data-selected={active?.id === t.id}>
                    <td>
                      <span className="aw-table-direction">
                        {t.side === "buy" ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <ArrowUpRight size={15} />
                        )}
                        {t.side}
                      </span>
                    </td>
                    <td>
                      <button className="aw-table-asset" onClick={() => setSelected(t.id)}>
                        <AssetLogo symbol={t.symbol} />
                        <strong>{t.symbol}</strong>
                      </button>
                    </td>
                    <td>{amount(t.quantity)}</td>
                    <td>{usd(t.total, 2)}</td>
                    <td>
                      <span className="aw-status">
                        <Check size={13} />
                        Recorded
                      </span>
                    </td>
                    <td>
                      <time dateTime={t.at}>{formatDate(t.at)}</time>
                    </td>
                    <td>
                      <button
                        aria-label={`Inspect ${t.side} ${t.symbol} ${t.id}`}
                        onClick={() => setSelected(t.id)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <div className="aw-empty">
              <History size={32} strokeWidth={1.2} />
              <h2>
                {query || side !== "All" ? "No matching activity" : "Your activity starts here"}
              </h2>
              <p>
                {query || side !== "All"
                  ? "Try another asset or change your filters."
                  : "Your recorded orders will appear here, with every detail in one place."}
              </p>
              <button className="aw-button" onClick={() => onNavigate("trading")}>
                Open trading <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <div className="aw-pagination">
            <span>
              {trades.length ? currentPage * 6 + 1 : 0}–
              {Math.min(currentPage * 6 + 6, trades.length)} of {trades.length}
            </span>
            <div>
              <button
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>
              <span>{currentPage + 1}</span>
              <button
                disabled={(currentPage + 1) * 6 >= trades.length}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
        <aside className="aw-panel aw-transaction-detail">
          <h2>Transaction details</h2>
          {active ? (
            <>
              <div className="aw-asset-heading">
                <AssetLogo symbol={active.symbol} />
                <div>
                  <h2>{active.symbol}</h2>
                  <p>{INSTRUMENTS.find((a) => a.symbol === active.symbol)?.name}</p>
                </div>
              </div>
              <p className="aw-transaction-description">
                {active.side === "buy" ? "Bought" : "Sold"} {amount(active.quantity)}{" "}
                {active.symbol}
              </p>
              <strong className="aw-transaction-total">{usd(active.total, 2)}</strong>
              <span className="aw-status">
                <Check size={14} /> Recorded
              </span>
              <Facts
                items={[
                  ["Price", usd(active.price, 2)],
                  ["Quantity", amount(active.quantity)],
                  ["Order type", "Market"],
                  ["Time", formatDate(active.at)],
                  ["Order ID", active.id],
                ]}
              />
              <button className="aw-button" onClick={() => onNavigate("portfolio")}>
                View portfolio <ArrowUpRight size={14} />
              </button>
            </>
          ) : (
            <div className="aw-empty">
              <Info size={24} />
              <p>Select a transaction to inspect its details.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
