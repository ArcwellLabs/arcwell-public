import AssetLogo from "@/components/AssetLogo";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  ChartNoAxesCombined,
  BarChart3,
  Database,
  CircleAlert,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type {
  AssetDetail,
  AssetSearch,
  AssetNetwork,
  SourceStatus,
  MarketPool,
} from "../../../../src/asset-data";
import "./asset-research.css";

const money = (n: number | null) =>
  n === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumSignificantDigits: 6,
      }).format(n);
const compact = (n: number | null) =>
  n === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
const shortAddress = (v: string) => v.slice(0, 6) + "…" + v.slice(-4);
const time = (v: string) =>
  new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (v: number) =>
  new Date(v * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const signed = (v: number | null) =>
  v === null ? "Unavailable" : (v > 0 ? "+" : "") + v.toFixed(2) + "%";
async function get<T>(params: URLSearchParams, signal: AbortSignal): Promise<T> {
  const response = await fetch("/api/assets?" + params, { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Asset research is unavailable.");
  return body as T;
}
function Sources({ sources }: { sources: SourceStatus[] }) {
  return (
    <ul className="ar-source-list">
      {sources.map((s) => (
        <li key={s.name}>
          <div>
            <span className={s.status === "ok" ? "ar-source-dot" : "ar-source-dot is-off"} />
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name}
              <ArrowUpRight size={12} />
            </a>
          </div>
          <span>
            {s.status === "ok"
              ? `Retrieved ${time(s.observedAt)}`
              : `Unavailable · ${s.reason?.replaceAll("-", " ") || "provider failure"}${s.httpStatus ? ` (HTTP ${s.httpStatus})` : ""}${s.retryAt ? ` · retry after ${time(s.retryAt)}` : ""}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
export default function AssetResearch() {
  const [network, setNetwork] = useState<AssetNetwork>("mainnet");
  const [query, setQuery] = useState("EURC");
  const [results, setResults] = useState<AssetSearch | null>(null);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [tab, setTab] = useState("Price");
  const searchController = useRef<AbortController | null>(null);
  const search = async (q: string, page = 1, chosenNetwork = network) => {
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setBusy(true);
    setError("");
    if (page === 1) {
      setResults(null);
      setSelected("");
      setDetail(null);
    }
    try {
      const next = await get<AssetSearch>(
        new URLSearchParams({ network: chosenNetwork, q, page: String(page) }),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setResults((previous) =>
        page === 1 || !previous
          ? next
          : {
              ...next,
              items: [
                ...new Map([...previous.items, ...next.items].map((a) => [a.address, a])).values(),
              ],
            },
      );
      if (page === 1 && next.items.length) {
        setSelected(next.items[0].address);
        setTab("Price");
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  useEffect(() => {
    void search(query, 1, network);
    return () => searchController.current?.abort();
    // Search is submitted explicitly; network changes also start a fresh lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!selected) {
      setLoadingDetail(false);
      setDetailError("");
      return;
    }
    const controller = new AbortController();
    setLoadingDetail(true);
    setDetail(null);
    setDetailError("");
    void get<AssetDetail>(new URLSearchParams({ network, address: selected }), controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setDetail(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setDetailError(e instanceof Error ? e.message : "Could not load this asset.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDetail(false);
      });
    return () => controller.abort();
  }, [selected, network, refresh]);
  const stale = !!detail && clock - Date.parse(detail.observedAt) > 120000;
  const best =
    detail?.pools.find((p) => detail.priceSource === `${p.source} · ${p.dex} · ${p.address}`) ||
    null;
  const issuerRestricted =
    network === "mainnet" &&
    detail?.asset.address.toLowerCase() === "0x8a5d989bbb96929f689b0200f435f53da42bf490";
  const liveSources = detail?.sources.filter((s) => s.status === "ok").length || 0;
  return (
    <section className="asset-research" aria-label="Arc asset research">
      <aside className="ar-discovery" aria-label="Asset discovery">
        <div className="ar-rail-heading">
          <span>Find an asset</span>
          <Search size={15} />
        </div>
        <form
          className="ar-search"
          onSubmit={(e) => {
            e.preventDefault();
            void search(query.trim());
          }}
        >
          <label className="ar-visually-hidden" htmlFor="ar-query">
            Name, symbol or contract address
          </label>
          <div className="ar-input-wrap">
            <Search size={15} />
            <input
              id="ar-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              minLength={2}
              maxLength={100}
              required
              placeholder="Name, symbol, contract…"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" aria-label="Search assets" disabled={busy}>
              <ChevronRight size={17} />
            </button>
          </div>
          <label className="ar-visually-hidden" htmlFor="ar-network">
            Network
          </label>
          <select
            id="ar-network"
            value={network}
            onChange={(e) => {
              setSelected("");
              setDetail(null);
              setNetwork(e.target.value as AssetNetwork);
            }}
          >
            <option value="mainnet">Arc Mainnet</option>
            <option value="testnet">Arc Testnet</option>
          </select>
        </form>
        <div className="ar-quick-search" aria-label="Quick asset search">
          {["EURC", "USDC", "USYC"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                void search(s);
              }}
              aria-pressed={results?.query === s}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ar-result-heading" role="status">
          {busy
            ? "Searching sources…"
            : results
              ? `${results.items.length} ${results.items.length === 1 ? "match" : "matches"}`
              : "Asset discovery"}
          <span>{results ? time(results.observedAt) : ""}</span>
        </div>
        {error && (
          <p className="ar-alert" role="alert">
            {error}
          </p>
        )}
        <div className="ar-results" aria-busy={busy}>
          {results?.items.map((asset) => (
            <button
              className={`ar-result ${selected === asset.address ? "is-selected" : ""}`}
              key={asset.address}
              onClick={() => {
                setSelected(asset.address);
                setTab("Price");
              }}
              aria-pressed={selected === asset.address}
              aria-label={`Inspect ${asset.name} ${asset.address}`}
            >
              <AssetLogo network={network} address={asset.address} />
              <span className="ar-result-text">
                <strong>{asset.symbol || "TOKEN"}</strong>
                <span>{asset.name}</span>
                <code title={asset.address}>{shortAddress(asset.address)}</code>
              </span>
              <ChevronRight size={13} />
            </button>
          ))}
          {results && !results.items.length && (
            <p className="ar-rail-empty">
              {results.sources.some((s) => s.status !== "ok")
                ? "Some sources are unavailable. No matching assets were returned."
                : "No indexed assets match."}{" "}
              Try a full contract address.
            </p>
          )}
          {results?.nextPage && (
            <button
              className="ar-text-button"
              disabled={busy}
              onClick={() => void search(results.query, results.nextPage!)}
            >
              Load more matches
            </button>
          )}
        </div>
        <div className="ar-rail-footer">
          <p>
            {network === "testnet"
              ? "Testnet tokens have no investment value."
              : "Names can be copied. Check the contract before taking action."}
          </p>
          {results && (
            <details>
              <summary>Search sources</summary>
              <Sources sources={results.sources} />
            </details>
          )}
        </div>
      </aside>
      <div className="ar-main" aria-busy={loadingDetail}>
        {!detail && (
          <div className="ar-state" role="status">
            {loadingDetail ? (
              <RefreshCw size={24} className="ar-spin" />
            ) : (
              <ChartNoAxesCombined size={30} />
            )}
            <h2>
              {loadingDetail
                ? "Reading the market"
                : detailError
                  ? "Could not load this asset"
                  : "Your research starts here"}
            </h2>
            <p>
              {loadingDetail
                ? "Checking the contract, available prices and market history."
                : detailError ||
                  "Search an asset or paste its contract address to inspect its market data."}
            </p>
            {detailError && (
              <button className="ar-button" onClick={() => setRefresh((v) => v + 1)}>
                Try again
              </button>
            )}
          </div>
        )}
        {detail && (
          <>
            <header className="ar-asset-header">
              <div className="ar-asset-name">
                <AssetLogo network={network} address={detail.asset.address} />
                <div>
                  <h2>{detail.asset.symbol || detail.asset.name}</h2>
                  <p>
                    {detail.asset.name !== detail.asset.symbol
                      ? detail.asset.name
                      : "Quoted in USD"}
                  </p>
                </div>
              </div>
              <div className="ar-price">
                <span>Observed price</span>
                <strong>{money(detail.priceUsd)}</strong>
              </div>
              <div
                className={`ar-change ${best?.change24h != null && best.change24h < 0 ? "is-negative" : ""}`}
              >
                <strong>{signed(best?.change24h ?? null)}</strong>
                <span>24h · selected pool</span>
              </div>
              <div className="ar-asset-actions">
                <button
                  className="ar-icon-button"
                  onClick={() => setRefresh((v) => v + 1)}
                  aria-label="Refresh asset data"
                >
                  <RefreshCw size={15} />
                </button>
                {issuerRestricted && <span className="ar-access-note">Issuer access required</span>}
                {network === "mainnet" &&
                  !issuerRestricted &&
                  detail.contractRead &&
                  detail.asset.address.toLowerCase() !==
                    "0x3600000000000000000000000000000000000000" && (
                    <Link
                      className="ar-button ar-button-primary"
                      to="/dashboard"
                      search={{ view: "swap", asset: detail.asset.address }}
                    >
                      Prepare a swap
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
              </div>
            </header>
            <div className="ar-metric-strip">
              <Metric
                name="Pool liquidity"
                value={
                  best?.liquidityUsd == null ? "Unavailable" : "$" + compact(best.liquidityUsd)
                }
              />
              <Metric
                name="24h pool volume"
                value={
                  best?.volume24hUsd == null ? "Unavailable" : "$" + compact(best.volume24hUsd)
                }
              />
              <Metric
                name="Holders"
                value={compact(detail.holders)}
                note={
                  detail.holdersUpdatedAt
                    ? `Indexer snapshot · ${new Date(detail.holdersUpdatedAt).toLocaleString()}`
                    : "Indexer update time not supplied"
                }
              />
            </div>
            {(stale || detail.warnings.length > 0) && (
              <div className="ar-notices" role="status">
                {stale && (
                  <p>
                    <CircleAlert size={14} />
                    Snapshot is over two minutes old. Refresh before using it.
                  </p>
                )}
                {detail.warnings.map((w) => (
                  <p key={w}>
                    <CircleAlert size={14} />
                    {w}
                  </p>
                ))}
              </div>
            )}
            <div className={`ar-analysis-grid${tab === "Sources" ? " has-context" : ""}`}>
              <div className="ar-analysis">
                <div className="ar-tabs" role="group" aria-label="Research views">
                  {["Price", "Markets", "Sources"].map((v) => (
                    <button key={v} aria-pressed={tab === v} onClick={() => setTab(v)}>
                      {v}
                      {v === "Markets" && <span>{detail.pools.length}</span>}
                      {v === "Sources" && (
                        <span title="Sources responding">
                          {liveSources}/{detail.sources.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {tab === "Price" && <PriceHistory key={network + selected} detail={detail} />}
                {tab === "Markets" && <PoolTable pools={detail.pools} />}
                {tab === "Sources" && (
                  <div className="ar-source-panel">
                    <div className="ar-section-title">
                      <h3>Behind the numbers</h3>
                      <Database size={16} />
                    </div>
                    <p>
                      Provider observations are retrieved independently. A responding source does
                      not guarantee that every field is available.
                    </p>
                    <Sources sources={detail.sources} />
                    <p>
                      Snapshot retrieved {new Date(detail.observedAt).toLocaleString()}. Asset
                      snapshots may be cached for up to 60 seconds. Provider publication times may
                      differ.
                    </p>
                    {detail.historyObservedAt && (
                      <p>
                        History: {detail.historyStatus} · original retrieval{" "}
                        {new Date(detail.historyObservedAt).toLocaleString()}.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {tab === "Sources" && (
                <aside className="ar-context" aria-label="Market context">
                  <div className="ar-section-title">
                    <h3>Market snapshot</h3>
                    <ChartNoAxesCombined size={16} />
                  </div>
                  <dl className="ar-facts">
                    <div>
                      <dt>Network</dt>
                      <dd>Arc {network === "mainnet" ? "Mainnet" : "Testnet"}</dd>
                    </div>
                    <div>
                      <dt>Price source</dt>
                      <dd>{best?.source || "Unavailable"}</dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd>{best?.dex || "Unavailable"}</dd>
                    </div>
                    <div>
                      <dt>Retrieved</dt>
                      <dd>{time(detail.observedAt)}</dd>
                    </div>
                    <div>
                      <dt>Provider price gap</dt>
                      <dd>
                        {detail.priceSpreadPercent === null
                          ? "Unavailable"
                          : detail.priceSpreadPercent.toFixed(2) + "%"}
                      </dd>
                    </div>
                  </dl>
                  <p className="ar-context-note">
                    Price uses the most liquid returned pool with a valid quote. It is not an
                    executable quote.
                  </p>
                  {best && (
                    <a
                      className="ar-selected-pool"
                      href={best.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {best.pair}
                      <ArrowUpRight size={13} />
                    </a>
                  )}
                  <ContractDetails detail={detail} />
                </aside>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Metric({ name, value, note }: { name: string; value: string; note?: string }) {
  return (
    <div className="ar-metric" title={note}>
      <span>{name}</span>
      <strong>{value}</strong>
    </div>
  );
}
function PriceHistory({ detail }: { detail: AssetDetail }) {
  const [range, setRange] = useState("30D");
  const [mode, setMode] = useState("Price");
  const history = useMemo(() => {
    const sorted = [...detail.history].sort((a, b) => a.timestamp - b.timestamp);
    if (range === "All" || !sorted.length) return sorted;
    const cutoff = sorted[sorted.length - 1].timestamp - (range === "7D" ? 6 : 29) * 86400;
    return sorted.filter((c) => c.timestamp >= cutoff);
  }, [detail.history, range]);
  const grid = (
    <CartesianGrid vertical={false} stroke="var(--color-hairline-strong)" strokeDasharray="2 5" />
  );
  const axes = [
    <XAxis
      key="date"
      dataKey="timestamp"
      tickFormatter={day}
      tickLine={false}
      axisLine={false}
      minTickGap={45}
      tick={{ fill: "#8b8b93", fontSize: 11 }}
    />,
    <YAxis
      key="value"
      orientation="right"
      domain={mode === "Price" ? ["auto", "auto"] : [0, "auto"]}
      tickFormatter={(v) => (mode === "Price" ? money(v) : compact(v))}
      tickLine={false}
      axisLine={false}
      width={80}
      tick={{ fill: "#8b8b93", fontSize: 11 }}
    />,
    <Tooltip
      key="tooltip"
      contentStyle={{
        background: "var(--color-surface)",
        border: "1px solid #333338",
        borderRadius: 6,
        color: "var(--color-ink)",
        fontSize: 12,
      }}
      labelFormatter={(v) => new Date(Number(v) * 1000).toISOString().slice(0, 10) + " UTC"}
      formatter={(v: number) => [money(v), mode === "Price" ? "Daily close" : "Pool volume"]}
    />,
  ];
  return (
    <section className="ar-chart" aria-label="Price history">
      <div className="ar-chart-toolbar">
        <div>
          <h3>{mode === "Price" ? "Price history" : "Daily pool volume"}</h3>
          <span>{history.length} daily observations · USD</span>
        </div>
        <div className="ar-chart-controls">
          <div className="ar-segments" role="group" aria-label="History range">
            {["7D", "30D", "All"].map((r) => (
              <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <div className="ar-segments" role="group" aria-label="Chart measure">
            <button
              aria-label="Price chart"
              aria-pressed={mode === "Price"}
              onClick={() => setMode("Price")}
            >
              <ChartNoAxesCombined size={15} />
            </button>
            <button
              aria-label="Volume chart"
              aria-pressed={mode === "Volume"}
              onClick={() => setMode("Volume")}
            >
              <BarChart3 size={15} />
            </button>
          </div>
        </div>
      </div>
      {detail.historyStatus === "stale" && (
        <p className="ar-history-warning">
          Last known history · refresh unavailable. Original retrieval{" "}
          {detail.historyObservedAt && new Date(detail.historyObservedAt).toLocaleString()}.
        </p>
      )}
      <div
        className="ar-chart-canvas"
        role="img"
        aria-label={`${detail.asset.symbol} ${mode.toLowerCase()} history; exact values available in Daily data below`}
      >
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            {mode === "Price" ? (
              <LineChart data={history} margin={{ top: 20, right: 4, bottom: 10, left: 4 }}>
                {grid}
                {axes}
                <Line
                  type="linear"
                  dataKey="close"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={history.length < 8 ? { r: 3, fill: "var(--color-accent)" } : false}
                  activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--color-bg)" }}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
              <BarChart data={history} margin={{ top: 20, right: 4, bottom: 10, left: 4 }}>
                {grid}
                {axes}
                <Bar
                  dataKey="volume"
                  fill="#8b8b93"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="ar-chart-empty">
            <ChartNoAxesCombined size={32} />
            <h3>
              {history.length === 1 ? "One daily observation available" : "History is unavailable"}
            </h3>
            <p>
              {history.length === 1
                ? "A price trend needs more than one observation. The available values are in Daily data below."
                : "The connected sources have not returned a usable series for this asset. You can still inspect its contract and available markets."}
            </p>
          </div>
        )}
      </div>
      <div className="ar-chart-caption">
        <span>
          GeckoTerminal · {detail.historyStatus}
          {detail.historyObservedAt ? " · " + time(detail.historyObservedAt) : ""}
        </span>
        {detail.historyUrl && (
          <a href={detail.historyUrl} target="_blank" rel="noreferrer">
            Source pool
            <ArrowUpRight size={12} />
          </a>
        )}
      </div>
      {history.length > 0 && (
        <details className="ar-daily-data">
          <summary>
            Daily data <span>OHLCV · current day may be incomplete</span>
          </summary>
          <div className="ar-table-scroll">
            <table>
              <thead>
                <tr>
                  {["Date (UTC)", "Open", "High", "Low", "Close", "Pool volume"].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((c) => (
                  <tr key={c.timestamp}>
                    <td>{new Date(c.timestamp * 1000).toISOString().slice(0, 10)}</td>
                    <td>{money(c.open)}</td>
                    <td>{money(c.high)}</td>
                    <td>{money(c.low)}</td>
                    <td>{money(c.close)}</td>
                    <td>{money(c.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
function PoolTable({ pools }: { pools: MarketPool[] }) {
  const [sort, setSort] = useState("liquidity");
  const ordered = useMemo(
    () =>
      [...pools].sort((a, b) =>
        sort === "volume"
          ? (b.volume24hUsd ?? -1) - (a.volume24hUsd ?? -1)
          : (b.liquidityUsd ?? -1) - (a.liquidityUsd ?? -1),
      ),
    [pools, sort],
  );
  return (
    <section className="ar-markets">
      <div className="ar-section-title">
        <h3>Markets & liquidity</h3>
        <label className="ar-sort">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort markets">
            <option value="liquidity">Liquidity</option>
            <option value="volume">24h volume</option>
          </select>
        </label>
      </div>
      {pools.length ? (
        <div className="ar-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Market / provider</th>
                <th>Price</th>
                <th>Liquidity</th>
                <th>24h volume</th>
                <th>24h change</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((p) => (
                <tr key={p.source + p.address}>
                  <td>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      {p.pair}
                      <ArrowUpRight size={11} />
                    </a>
                    <small>
                      {p.source} · {p.dex} · {time(p.observedAt)}
                    </small>
                  </td>
                  <td>{money(p.priceUsd)}</td>
                  <td>{money(p.liquidityUsd)}</td>
                  <td>{money(p.volume24hUsd)}</td>
                  <td className={p.change24h !== null && p.change24h < 0 ? "ar-negative" : ""}>
                    {signed(p.change24h)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ar-empty">No supported market pools returned for this asset.</p>
      )}
      <p className="ar-table-note">
        Rows may describe the same pool. Liquidity and volume are not added across providers.
      </p>
    </section>
  );
}
function ContractDetails({ detail }: { detail: AssetDetail }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  useEffect(() => {
    setCopied(false);
    setCopyError("");
  }, [detail.asset.address]);
  return (
    <details className="ar-contract">
      <summary>Contract details</summary>
      <div className="ar-contract-body">
        <span className="ar-muted">Contract address</span>
        <code>{detail.asset.address}</code>
        <button
          className="ar-text-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(detail.asset.address);
              setCopied(true);
              setCopyError("");
            } catch {
              setCopyError("Copy unavailable. Select the address above to copy it.");
            }
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy address"}
        </button>
        {copyError && <p role="status">{copyError}</p>}
        <dl className="ar-facts">
          <div>
            <dt>Issuer</dt>
            <dd>{detail.reference?.issuer || "Not confirmed"}</dd>
          </div>
          <div>
            <dt>Contract read</dt>
            <dd>{detail.contractRead ? "Arc RPC" : "Unconfirmed"}</dd>
          </div>
          <div>
            <dt>Decimals</dt>
            <dd>{detail.decimals ?? "Unavailable"}</dd>
          </div>
          <div>
            <dt>Supply</dt>
            <dd>{detail.supply || "Unavailable"}</dd>
          </div>
          {detail.block && (
            <div>
              <dt>RPC block</dt>
              <dd>{detail.block}</dd>
            </div>
          )}
          <div>
            <dt>Holders updated</dt>
            <dd>
              {detail.holdersUpdatedAt
                ? new Date(detail.holdersUpdatedAt).toLocaleString()
                : "Not supplied"}
            </dd>
          </div>
        </dl>
        {detail.reference && (
          <>
            <a href={detail.reference.url} target="_blank" rel="noreferrer">
              Arc's published contract
              <ArrowUpRight size={12} />
            </a>
            <p>{detail.reference.access}</p>
            <p>
              The address matches Arc's reference. This is an identity check, not a security audit.
            </p>
          </>
        )}
        {detail.description && (
          <details>
            <summary>Provider description</summary>
            <p>{detail.description}</p>
            <p>GeckoTerminal profile. Issuer claims are not independently verified.</p>
          </details>
        )}
      </div>
    </details>
  );
}
