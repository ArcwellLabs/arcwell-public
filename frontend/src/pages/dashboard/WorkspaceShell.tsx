import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  ChartCandlestick,
  History,
  Globe,
  SlidersHorizontal,
  Search,
  ArrowUpRight,
  X,
} from "lucide-react";
import WalletButton from "@/components/wallet/WalletButton";
import { searchStocks } from "../../../../src/workspace-search";
import type { AssetSearch } from "../../../../src/asset-data";
import { useWalletSession } from "@/lib/wallet-session";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import "./workspace.css";

const navigation = [
  { id: "portfolio", label: "Portfolio", icon: ChartNoAxesCombined },
  { id: "markets", label: "Trade", icon: ChartCandlestick },
  { id: "swap", label: "Swap", icon: ArrowLeftRight },
  { id: "ledger", label: "Activity", icon: History },
  { id: "arc", label: "Arc", icon: Globe },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];
const destinations = [
  { id: "portfolio", label: "Portfolio" },
  { id: "markets", label: "Arc research" },
  { id: "stocks", label: "Tokenized stocks" },
  { id: "trading", label: "Trading" },
  { id: "swap", label: "Swap" },
  { id: "ledger", label: "Activity" },
  { id: "arc", label: "Arc workspace" },
  { id: "settings", label: "Settings" },
];
export default function WorkspaceShell({
  view,
  onNavigate,
  onOpenAsset,
  onSearch,
  children,
}: {
  view: string;
  onNavigate: (view: string) => void;
  onOpenAsset: (view: "stocks" | "markets", address: string) => void;
  onSearch: (view: "stocks" | "markets", query: string) => void;
  children: ReactNode;
}) {
  const { preferences } = useWorkspacePreferences();
  const [clock, setClock] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<AssetSearch | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchKind, setSearchKind] = useState("All");
  const { locked } = useWalletSession();
  const term = query.trim();
  useEffect(() => {
    setTokens(null);
    setTokenError("");
    setSearching(false);
    if (!open || term.length < 2 || searchKind === "Stocks & ETFs") return;
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/assets?" + new URLSearchParams({ network: "mainnet", q: term }),
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Token search is unavailable.");
        if (!controller.signal.aborted) setTokens(data);
      } catch (error) {
        if (!controller.signal.aborted)
          setTokenError(error instanceof Error ? error.message : "Token search is unavailable.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, open, searchKind]);
  const input = useRef<HTMLInputElement>(null);
  const search = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat("en-US", {
          timeZone: preferences.timezone,
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZoneName: "short",
        }).format(new Date()),
      );
    update();
    const timer = window.setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [preferences.timezone]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        input.current?.blur();
      }
    };
    const outside = (event: PointerEvent) => {
      if (search.current && !search.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  const navigate = (id: string) => {
    if (locked) return;
    onNavigate(id);
    setOpen(false);
    setQuery("");
  };
  const pages = destinations.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  const stocks = term && searchKind !== "Coins & tokens" ? searchStocks(term) : [];
  const openAsset = (destination: "stocks" | "markets", address: string) => {
    if (locked) return;
    onOpenAsset(destination, address);
    setOpen(false);
    setQuery("");
  };
  const browse = (destination: "stocks" | "markets") => {
    if (locked) return;
    onSearch(destination, term);
    setOpen(false);
    setQuery("");
  };
  return (
    <div
      className="aw-desk"
      data-view={view}
      data-density={preferences.density}
      data-reduce-motion={preferences.reduceMotion}
    >
      <a className="aw-skip" href="#workspace-content">
        Skip to workspace
      </a>
      <aside className="aw-rail">
        <Link to="/" className="aw-brand-mark" aria-label="ARCWELL home">
          <img src="/logo-mark.png" alt="" />
        </Link>
        <nav aria-label="Dashboard">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={locked}
              onClick={() => navigate(id)}
              aria-current={
                view === id || (id === "markets" && ["trading", "stocks"].includes(view))
                  ? "page"
                  : undefined
              }
            >
              <Icon size={22} strokeWidth={1.4} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <Link to="/whitepaper" className="aw-rail-bottom" aria-label="Documentation">
          <ArrowUpRight size={18} />
        </Link>
      </aside>
      <header className="aw-topbar">
        <Link to="/" className="aw-wordmark">
          ARCWELL<sup>®</sup>
        </Link>
        <div
          className="aw-command"
          ref={search}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
          }}
        >
          <Search size={17} />
          <input
            ref={input}
            type="search"
            aria-label="Search workspace"
            aria-expanded={open}
            aria-controls="workspace-search-results"
            placeholder="Search assets, research, or markets…"
            maxLength={100}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
          {open ? (
            <button aria-label="Close search" onClick={() => setOpen(false)}>
              <X size={15} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
          {open && (
            <div id="workspace-search-results" className="aw-search-results">
              <div className="aw-search-kinds" role="group" aria-label="Search category">
                {["All", "Stocks & ETFs", "Coins & tokens"].map((kind) => (
                  <button
                    key={kind}
                    aria-pressed={searchKind === kind}
                    onClick={() => setSearchKind(kind)}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              {pages.length > 0 && <p>Workspace</p>}
              {pages.map((page) => (
                <button key={page.id} disabled={locked} onClick={() => navigate(page.id)}>
                  {page.label}
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {stocks.length > 0 && (
                <>
                  <p>
                    Stocks & ETFs · {stocks.length} {stocks.length === 1 ? "match" : "matches"}
                  </p>
                  {stocks.slice(0, 8).map((asset) => (
                    <button
                      key={asset.address}
                      disabled={locked}
                      onClick={() => openAsset("stocks", asset.address)}
                    >
                      <span>
                        <strong>{asset.symbol}</strong>
                        <small>{asset.name}</small>
                      </span>
                      <span className="aw-search-chain">
                        Ethereum <ArrowUpRight size={14} />
                      </span>
                    </button>
                  ))}
                  <button onClick={() => browse("stocks")} disabled={locked}>
                    View {stocks.length === 1 ? "stock" : `all ${stocks.length} stocks & ETFs`}{" "}
                    <ArrowUpRight size={14} />
                  </button>
                </>
              )}
              {term.length >= 2 && searchKind !== "Stocks & ETFs" && (
                <>
                  <p>Coins & tokens · Arc Mainnet</p>
                  {searching && <p role="status">Searching connected sources…</p>}
                  {tokenError && <p role="status">{tokenError}</p>}
                  {tokens?.items.slice(0, 8).map((asset) => (
                    <button
                      key={asset.address}
                      disabled={locked}
                      onClick={() => openAsset("markets", asset.address)}
                    >
                      <span>
                        <strong>{asset.symbol}</strong>
                        <small>{asset.name}</small>
                      </span>
                      <span className="aw-search-chain">
                        {asset.address.slice(0, 6)}…{asset.address.slice(-4)}{" "}
                        <ArrowUpRight size={14} />
                      </span>
                    </button>
                  ))}
                  {tokens && !tokens.items.length && (
                    <p>No matching assets returned on Arc Mainnet.</p>
                  )}
                  {tokens?.sources.some((source) => source.status !== "ok") && (
                    <p>Some sources are unavailable. Results may be incomplete.</p>
                  )}
                  <button disabled={locked} onClick={() => browse("markets")}>
                    Open full token search <ArrowUpRight size={14} />
                  </button>
                </>
              )}
              {term && searchKind !== "Coins & tokens" && !stocks.length && (
                <p>No issuer-listed stocks match this search.</p>
              )}
              {!term && (
                <p>
                  Search {searchStocks("").length} stocks & ETFs, or discover coins by name, symbol
                  or contract.
                </p>
              )}
              {locked && (
                <p role="status">Finish the current wallet request before changing assets.</p>
              )}
            </div>
          )}
        </div>
        <time className="aw-clock">{clock}</time>
        <WalletButton className="aw-header-wallet" />
      </header>
      <main id="workspace-content" className="aw-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="aw-footer">
        <Link to="/" className="aw-wordmark">
          ARCWELL<sup>®</sup>
        </Link>
        <span>A more open financial system.</span>
        <Link to="/whitepaper">
          Documentation <ArrowUpRight size={12} />
        </Link>
      </footer>
    </div>
  );
}
