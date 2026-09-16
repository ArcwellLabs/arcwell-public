import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpRight, RefreshCw } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import type {
  AssetDetail,
  AssetSearch,
  AssetNetwork,
  SourceStatus,
} from "../../../../src/asset-data";
import "./asset-research.css";

const money = (n: number | null) =>
  n === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumSignificantDigits: 7,
      }).format(n);
const count = (n: number | null) =>
  n === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const time = (v: string) =>
  new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
async function get<T>(params: URLSearchParams, signal: AbortSignal): Promise<T> {
  const response = await fetch("/api/assets?" + params, { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Asset research is unavailable.");
  return body as T;
}
function Sources({ sources }: { sources: SourceStatus[] }) {
  return (
    <details className="ar-sources">
      <summary>Sources & availability</summary>
      <ul>
        {sources.map((s) => (
          <li key={s.name}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name} <ArrowUpRight size={11} />
            </a>
            <span>
              {s.status === "ok" ? `Retrieved ${time(s.observedAt)}` : "Temporarily unavailable"}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
export default function AssetResearch() {
  const [network, setNetwork] = useState<AssetNetwork>("mainnet");
  const [query, setQuery] = useState("USDC");
  const [results, setResults] = useState<AssetSearch | null>(null);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const searchController = useRef<AbortController | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
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
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  useEffect(() => {
    void search(query, 1, network);
    return () => searchController.current?.abort();
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
  const stale = detail && clock - Date.parse(detail.observedAt) > 120000;
  return (
    <section className="asset-research" aria-label="Arc asset research">
      <div className="ar-intro">
        <div>
          <p className="q-eyebrow">Connected asset research</p>
          <h2>Find an asset on Arc.</h2>
          <p>
            Search by name, symbol, or contract address. Inspect onchain facts and sourced market
            observations.
          </p>
        </div>
        <span className="q-badge">Read-only research</span>
      </div>
      <form
        className="ar-search"
        onSubmit={(e) => {
          e.preventDefault();
          void search(query);
        }}
      >
        <label>
          Network
          <select value={network} onChange={(e) => setNetwork(e.target.value as AssetNetwork)}>
            <option value="mainnet">Arc Mainnet</option>
            <option value="testnet">Arc Testnet</option>
          </select>
        </label>
        <label className="ar-query">
          Name, symbol or contract address
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            minLength={2}
            maxLength={100}
            required
            placeholder="USDC, EURC, or 0x…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button className="q-button" type="submit" disabled={busy}>
          <Search size={15} />
          {busy ? "Searching…" : "Search assets"}
        </button>
      </form>
      <p className="ar-caption">
        {network === "mainnet"
          ? "Market-index search plus contract lookup. Names are not unique; always check the address."
          : "Testnet discovery only. These tokens have no investment value."}
      </p>
      {error && (
        <p className="q-notice" role="alert">
          {error}
        </p>
      )}
      <div aria-live="polite" aria-busy={busy}>
        {results && (
          <>
            <div className="ar-result-heading">
              <span>
                {results.items.length} results for “{results.query}”
              </span>
              <span>Retrieved {time(results.observedAt)}</span>
            </div>
            {!results.items.length && (
              <p className="ar-empty">
                {results.sources.some((s) => s.status === "unavailable")
                  ? "Some sources are unavailable. No matching assets were returned by the sources that responded."
                  : "No indexed asset matches this search."}{" "}
                Try the full contract address for an onchain lookup.
              </p>
            )}
            <div className="ar-results">
              {results.items.map((asset) => (
                <button
                  type="button"
                  className={`ar-result ${selected === asset.address ? "is-selected" : ""}`}
                  key={asset.address}
                  onClick={() => {
                    setSelected(asset.address);
                    setTimeout(
                      () =>
                        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      0,
                    );
                  }}
                  aria-label={`Inspect ${asset.name} ${asset.address}`}
                >
                  <div className="ar-result-top">
                    <strong>{asset.symbol || "TOKEN"}</strong>
                    <span>{asset.type}</span>
                  </div>
                  <p>{asset.name}</p>
                  <code>{asset.address}</code>
                  <span className="ar-result-source">
                    {asset.sources.join(" · ")} <ArrowUpRight size={12} />
                  </span>
                </button>
              ))}
            </div>
            {results.nextPage && (
              <button
                className="q-button"
                disabled={busy}
                onClick={() => void search(results.query, results.nextPage!)}
              >
                Load more matches
              </button>
            )}
            <Sources sources={results.sources} />
          </>
        )}
      </div>
      <div ref={detailRef} className="ar-detail" aria-live="polite" aria-busy={loadingDetail}>
        {loadingDetail && <p className="ar-empty">Reading contract metadata and market sources…</p>}
        {detailError && (
          <p className="q-notice" role="alert">
            {detailError}{" "}
            <button className="q-button" onClick={() => setRefresh((v) => v + 1)}>
              Retry
            </button>
          </p>
        )}
        {detail && (
          <>
            <header className="ar-detail-heading">
              <div>
                <p className="q-eyebrow">
                  {network === "mainnet" ? "Arc Mainnet · 5042" : "Arc Testnet · 5042002"}
                </p>
                <h2>
                  {detail.asset.name} <span>{detail.asset.symbol}</span>
                </h2>
                <code>{detail.asset.address}</code>
              </div>
              <button className="q-button" onClick={() => setRefresh((v) => v + 1)}>
                <RefreshCw size={13} />
                Refresh data
              </button>
            </header>
            <div className="ar-freshness">
              {stale
                ? "Snapshot is over two minutes old — refresh before using it."
                : `Retrieved ${time(detail.observedAt)} · cached up to 60 seconds`}{" "}
              · Provider publication times may differ.
            </div>
            {detail.warnings.map((w) => (
              <p className="q-notice" key={w}>
                {w}
              </p>
            ))}
            <div className="ar-metrics">
              <Metric
                name="Observed USD price"
                value={money(detail.priceUsd)}
                note={detail.priceSource || "No reliable priced market returned"}
              />
              <Metric
                name="Contract supply"
                value={detail.supply || "Unavailable"}
                note={
                  detail.block
                    ? `Arc RPC · block ${detail.block}`
                    : "Onchain supply could not be read"
                }
              />
              <Metric
                name="Token decimals"
                value={detail.decimals === null ? "Unavailable" : String(detail.decimals)}
                note={detail.contractRead ? "Read from contract" : "Indexer metadata"}
              />
              <Metric
                name="Holders"
                value={count(detail.holders)}
                note={
                  detail.holdersUpdatedAt
                    ? `Indexer snapshot · ${new Date(detail.holdersUpdatedAt).toLocaleString()}`
                    : "Indexer-reported · update time not supplied"
                }
              />
            </div>
            <p className="ar-caption">
              Price uses the most liquid returned pool with a valid quote. Pool prices are
              observations, not firm execution quotes.{" "}
              {detail.priceSpreadPercent !== null &&
                `Cross-provider price difference: ${detail.priceSpreadPercent.toFixed(2)}%.`}
            </p>
            {detail.reference && (
              <div className="ar-description">
                <h3>Issuer & access</h3>
                <p>
                  {detail.reference.issuer} · {detail.reference.access}
                </p>
                <a href={detail.reference.url} target="_blank" rel="noreferrer">
                  Contract matches Arc’s published reference <ArrowUpRight size={12} />
                </a>
              </div>
            )}
            {detail.description && (
              <div className="ar-description">
                <h3>Provider description</h3>
                <p>{detail.description}</p>
                <span>GeckoTerminal profile · issuer claims are not independently verified.</span>
              </div>
            )}
            <div className="ar-chart">
              <h3>Daily price history</h3>
              <p className="ar-caption">
                {detail.history.length
                  ? `${detail.history.length} available daily observations · USD · GeckoTerminal · current day may be incomplete`
                  : "Historical data unavailable for this asset."}
              </p>
              {detail.history.length > 1 && (
                <div
                  style={{ height: 260, width: "100%" }}
                  role="img"
                  aria-label={`Daily USD closing prices for ${detail.asset.name}; exact values in the table below`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.history}>
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(n) =>
                          new Date(n * 1000).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        minTickGap={40}
                      />
                      <YAxis domain={["auto", "auto"]} width={85} tickFormatter={(n) => money(n)} />
                      <Tooltip
                        labelFormatter={(n) => new Date(Number(n) * 1000).toLocaleDateString()}
                        formatter={(n: number) => [money(n), "USD close"]}
                      />
                      <Line
                        type="linear"
                        dataKey="close"
                        stroke="var(--accent, #d9e9a3)"
                        dot={detail.history.length < 10}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {detail.history.length > 0 && (
                <details>
                  <summary>View daily OHLCV values</summary>
                  <div className="ar-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {["UTC date", "Open", "High", "Low", "Close", "Pool volume USD"].map(
                            (h) => (
                              <th key={h}>{h}</th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.history.map((c) => (
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
              {detail.historyUrl && (
                <a
                  className="ar-source-link"
                  href={detail.historyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  History source pool <ArrowUpRight size={12} />
                </a>
              )}
            </div>
            <h3>Markets & liquidity</h3>
            <p className="ar-caption">
              Each row is one provider’s pool observation. Rows may describe the same pool; volumes
              and liquidity are not summed.
            </p>
            {detail.pools.length ? (
              <div className="ar-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "Source / market",
                        "Asset price",
                        "Pool liquidity",
                        "Pool 24h volume",
                        "24h change",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.pools.map((p) => (
                      <tr key={p.source + p.address}>
                        <td>
                          <a href={p.url} target="_blank" rel="noreferrer">
                            {p.pair} <ArrowUpRight size={11} />
                          </a>
                          <small>
                            {p.source} · {p.dex}
                          </small>
                        </td>
                        <td>{money(p.priceUsd)}</td>
                        <td>{money(p.liquidityUsd)}</td>
                        <td>{money(p.volume24hUsd)}</td>
                        <td>
                          {p.change24h === null ? "Unavailable" : p.change24h.toFixed(2) + "%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ar-empty">No supported market pools returned.</p>
            )}
            <Sources sources={detail.sources} />
          </>
        )}
      </div>
    </section>
  );
}
function Metric({ name, value, note }: { name: string; value: string; note: string }) {
  return (
    <div className="ar-metric">
      <span>{name}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
