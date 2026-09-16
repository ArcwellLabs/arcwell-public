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
import { INSTRUMENTS } from "@/lib/quant";
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
  onInstrument,
  children,
}: {
  view: string;
  onNavigate: (view: string) => void;
  onInstrument: (symbol: string) => void;
  children: ReactNode;
}) {
  const { preferences } = useWorkspacePreferences();
  const [clock, setClock] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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
    onNavigate(id);
    setOpen(false);
    setQuery("");
  };
  const pages = destinations.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  const assets = query.trim()
    ? INSTRUMENTS.filter((a) =>
        `${a.symbol} ${a.name}`.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 5)
    : [];
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
              <p>Workspace</p>
              {pages.map((page) => (
                <button key={page.id} onClick={() => navigate(page.id)}>
                  {page.label}
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {assets.length > 0 && <p>Instruments</p>}
              {assets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    onInstrument(asset.symbol);
                    navigate("trading");
                  }}
                >
                  <span>
                    {asset.symbol} <small>{asset.name}</small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {!pages.length && !assets.length && (
                <p>
                  No results. Open <button onClick={() => navigate("markets")}>Arc research</button>{" "}
                  to search contracts.
                </p>
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
