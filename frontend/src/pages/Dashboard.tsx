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
import { DISCLAIMER, NETWORK_STATUS } from "@/data/dashboard";
import { EASE, StatusPill } from "@/pages/dashboard/ui";
import Overview from "@/pages/dashboard/Overview";
import Organizations from "@/pages/dashboard/Organizations";
import Series from "@/pages/dashboard/Series";
import Transactions from "@/pages/dashboard/Transactions";
import Evidence from "@/pages/dashboard/Evidence";
import Verifiers from "@/pages/dashboard/Verifiers";
import Corrections from "@/pages/dashboard/Corrections";
import ApiRewards from "@/pages/dashboard/ApiRewards";
import Boundary from "@/pages/dashboard/Boundary";

interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORIES: Category[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "series", label: "RecordSeries", icon: FileStack },
  { id: "transactions", label: "Transactions", icon: ListOrdered },
  { id: "evidence", label: "Evidence", icon: Database },
  { id: "verifiers", label: "Verifiers", icon: ShieldCheck },
  { id: "corrections", label: "Corrections", icon: GitBranch },
  { id: "api", label: "API & Rewards", icon: KeyRound },
  { id: "settings", label: "Settings / Boundary", icon: SlidersHorizontal },
  { id: "assets", label: "Arc assets", icon: Coins },
  { id: "payments", label: "Payment drafts", icon: Send },
  { id: "activity", label: "Draft activity", icon: Activity },
  { id: "network", label: "Arc network", icon: Globe },
  { id: "integrations", label: "Arc integrations", icon: Plug },
];

const VALID_IDS = new Set(CATEGORIES.map((c) => c.id));

export default function Dashboard() {
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const search = useSearch({ from: "/dashboard" });
  const navigate = useNavigate({ from: "/dashboard" });
  const raw = search.view ?? "overview";
  const view = VALID_IDS.has(raw) ? raw : "overview";

  const setView = (id: string) => {
    void navigate({
      search: id === "overview" ? {} : { view: id },
      resetScroll: false,
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const saveDraft = (draft: PaymentDraft) => {
    setDrafts((previous) => [
      { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...previous,
    ]);
    setView("activity");
  };

  const renderView = () => {
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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
              ARCWELL control room <span className="text-faint">/ sample registry telemetry</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-faint sm:block">
              {NETWORK_STATUS.network} · slot {NETWORK_STATUS.currentSlot.toLocaleString("en-US")}
            </p>
            <StatusPill value={NETWORK_STATUS.state} />
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
            {CATEGORIES.map((c, i) => {
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
                Proof-only infrastructure.
                <br />
                Records what external systems report.
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
            {CATEGORIES.map((c) => {
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
        <main className="min-w-0 flex-1 px-6 py-8 md:px-10 lg:py-10 xl:px-14">
          <p className="mb-6 rounded-xl border border-hairline bg-surface/50 px-5 py-4 text-xs leading-relaxed text-ink-muted">
            Arc tools use the working testnet read functions and local draft validation. Registry
            records, organizations, evidence, verifier scores, API keys, rewards, and the status
            strip remain sample data.
          </p>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {renderView()}
          </motion.div>

          {/* Disclaimer strip */}
          <div className="mt-12 rounded-2xl border border-hairline bg-surface/50 px-5 py-4">
            <p className="text-[11px] leading-relaxed text-faint">{DISCLAIMER}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
