import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Building2,
  Database,
  FileStack,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Coins, Send, Activity, Globe, Plug } from "lucide-react";
import {
  ArcAssets,
  ArcPayments,
  ArcActivity,
  ArcNetwork,
  ArcIntegrations,
} from "@/pages/dashboard/ArcTools";
import type { DraftRecord } from "@/pages/dashboard/ArcTools";
import type { PaymentDraft } from "@/lib/arc";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISCLAIMER } from "@/data/dashboard";
import { EASE } from "@/pages/dashboard/ui";
import Overview from "@/pages/dashboard/Overview";
import Organizations from "@/pages/dashboard/Organizations";
import Series from "@/pages/dashboard/Series";
import Transactions from "@/pages/dashboard/Transactions";
import Evidence from "@/pages/dashboard/Evidence";
import Verifiers from "@/pages/dashboard/Verifiers";
import Corrections from "@/pages/dashboard/Corrections";
import ApiRewards from "@/pages/dashboard/ApiRewards";
import Boundary from "@/pages/dashboard/Boundary";
import MvpSettings from "@/pages/dashboard/MvpSettings";
import { isDashboardViewEnabled, resolveDashboardView } from "@/lib/dashboard-release";

import InvestingWorkspace from "@/pages/dashboard/InvestingWorkspace";
import { usePaperBook } from "@/hooks/usePaperBook";
import { INVESTING_VIEWS } from "@/lib/quant";
import LegacyAnalytics from "@/pages/dashboard/LegacyAnalytics";
import { ChartCandlestick, ChartNoAxesCombined, Orbit, Wallet, Scale, History } from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORIES: Category[] = [
  { id: "portfolio", label: "Portfolio", icon: LayoutDashboard },
  { id: "markets", label: "Markets", icon: ChartNoAxesCombined },
  { id: "trading", label: "Trade", icon: ChartCandlestick },
  { id: "risk", label: "Risk", icon: Scale },
  { id: "quant", label: "Quant Lab", icon: Orbit },
  { id: "funding", label: "Funding", icon: Wallet },
  { id: "ledger", label: "Activity", icon: History },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "series", label: "RecordSeries", icon: FileStack },
  { id: "transactions", label: "Transactions", icon: ListOrdered },
  { id: "evidence", label: "Evidence", icon: Database },
  { id: "verifiers", label: "Verifiers", icon: ShieldCheck },
  { id: "corrections", label: "Corrections", icon: GitBranch },
  { id: "api", label: "API & Rewards", icon: KeyRound },
  { id: "boundary", label: "Registry settings", icon: SlidersHorizontal },
  { id: "assets", label: "Arc assets", icon: Coins },
  { id: "payments", label: "Payment drafts", icon: Send },
  { id: "activity", label: "Draft activity", icon: Activity },
  { id: "network", label: "Arc network", icon: Globe },
  { id: "integrations", label: "Arc integrations", icon: Plug },
];

const VISIBLE_CATEGORIES = CATEGORIES.filter((category) => isDashboardViewEnabled(category.id));

export default function Dashboard() {
  const { book, setBook, loaded, storageNote } = usePaperBook();
  const [symbol, setSymbol] = useState("NVDA");
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const search = useSearch({ from: "/dashboard" });
  const navigate = useNavigate({ from: "/dashboard" });
  const raw = search.view ?? "portfolio";
  const view = resolveDashboardView(raw);

  const setView = (id: string) => {
    void navigate({
      search: resolveDashboardView(id) === "portfolio" ? {} : { view: resolveDashboardView(id) },
      resetScroll: false,
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const saveDraft = (draft: PaymentDraft) => {
    setDrafts((previous) => [
      {
        ...draft,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]);
    setView("activity");
  };

  const renderView = () => {
    if (INVESTING_VIEWS.includes(view))
      return (
        <InvestingWorkspace
          view={view}
          onNavigate={setView}
          symbol={symbol}
          setSymbol={setSymbol}
          book={book}
          setBook={setBook}
          ready={loaded}
          storageNote={storageNote}
        />
      );
    switch (view) {
      case "organizations":
        return <Organizations />;
      case "series":
        return <Series />;
      case "transactions":
        return <Transactions />;
      case "evidence":
        return <Evidence />;
      case "verifiers":
        return <Verifiers />;
      case "corrections":
        return <Corrections />;
      case "api":
        return <ApiRewards />;
      case "settings":
        return (
          <MvpSettings book={book} setBook={setBook} ready={loaded} storageNote={storageNote} />
        );
      case "boundary":
        return <Boundary />;
      case "assets":
        return <ArcAssets />;
      case "payments":
        return <ArcPayments onSave={saveDraft} />;
      case "activity":
        return <ArcActivity records={drafts} onPrepare={() => setView("payments")} />;
      case "network":
        return <ArcNetwork />;
      case "integrations":
        return <ArcIntegrations />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Top status strip */}
      <div className="border-b border-hairline bg-surface/60">
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3 md:px-10 xl:px-14">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
              ARCWELL <span className="text-faint">/ paper investing beta</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-faint sm:block">
              {view === "markets"
                ? "Asset discovery · no real execution"
                : "Practice account · no real execution"}
            </p>
            <span className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] text-ink-muted">
              {view === "markets" ? "Sourced asset data" : "Sample data"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1680px] flex-col lg:flex-row">
        {/* Left rail, desktop */}
        <aside className="hidden shrink-0 lg:block lg:w-64 xl:w-72">
          <nav
            aria-label="Dashboard categories"
            className="sticky top-[72px] flex max-h-[calc(100dvh-72px)] flex-col gap-1 overflow-y-auto border-r border-hairline px-4 py-8"
          >
            <p className="kicker mb-4 px-3">Categories</p>
            {VISIBLE_CATEGORIES.map((c, i) => {
              const active = view === c.id;
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setView(c.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-300",
                    active
                      ? "border-accent/40 bg-accent/10 text-ink"
                      : "border-transparent text-ink-muted hover:border-hairline hover:bg-surface hover:text-ink",
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "shrink-0 transition-colors",
                      active ? "text-accent" : "text-faint group-hover:text-ink-muted",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm">{c.label}</span>
                  <span
                    className={cn(
                      "font-mono text-[9px] tracking-[0.1em]",
                      active ? "text-accent" : "text-faint",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}

            <div className="mt-auto px-3 pt-8">
              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-faint">
                Paper investing & research.
                <br />
                Explore. Practice. Track.
              </p>
            </div>
          </nav>
        </aside>

        {/* Top tabs, mobile / tablet */}
        <div className="sticky top-[72px] z-30 border-b border-hairline bg-bg/90 backdrop-blur-md lg:hidden">
          <nav
            aria-label="Dashboard categories"
            className="touch-scroll flex gap-1 overflow-x-auto px-4 py-3"
          >
            {VISIBLE_CATEGORIES.map((c) => {
              const active = view === c.id;
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setView(c.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-300",
                    active
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink",
                  )}
                >
                  <Icon size={13} aria-hidden />
                  {c.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <section
          aria-label="Dashboard workspace"
          className="min-w-0 flex-1 px-6 py-8 md:px-10 lg:py-10 xl:px-14"
        >
          <p className="mb-6 rounded-xl border border-hairline bg-surface/50 px-5 py-4 text-xs leading-relaxed text-ink-muted">
            {view === "markets"
              ? "Search Arc assets by name, symbol, or contract address. Check each result’s network, source, and observation time. Trading remains a separate paper simulation."
              : "Prices and starting holdings are samples. Paper orders update only this browser’s account. No real assets or funds move."}
          </p>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {!INVESTING_VIEWS.includes(view) && view !== "settings" ? (
              <LegacyAnalytics view={view} drafts={drafts} />
            ) : null}
            {renderView()}
          </motion.div>

          {/* Disclaimer strip */}
          {!INVESTING_VIEWS.includes(view) && view !== "settings" ? (
            <div className="mt-12 rounded-2xl border border-hairline bg-surface/50 px-5 py-4">
              <p className="text-[11px] leading-relaxed text-faint">{DISCLAIMER}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
