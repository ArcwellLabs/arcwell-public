import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import WorkspaceShell from "@/pages/dashboard/WorkspaceShell";
import { WorkspacePreferencesProvider } from "@/pages/dashboard/WorkspacePreferences";
import {
  ArcAssets,
  ArcPayments,
  ArcActivity,
  ArcNetwork,
  ArcIntegrations,
} from "@/pages/dashboard/ArcTools";
import type { DraftRecord } from "@/pages/dashboard/ArcTools";
import type { PaymentDraft } from "@/lib/arc";
import Overview from "@/pages/dashboard/Overview";
import Organizations from "@/pages/dashboard/Organizations";
import Series from "@/pages/dashboard/Series";
import Transactions from "@/pages/dashboard/Transactions";
import Evidence from "@/pages/dashboard/Evidence";
import Verifiers from "@/pages/dashboard/Verifiers";
import Corrections from "@/pages/dashboard/Corrections";
import ApiRewards from "@/pages/dashboard/ApiRewards";
import Boundary from "@/pages/dashboard/Boundary";
import SwapWorkspace from "@/pages/dashboard/SwapWorkspace";
import ArcWorkspace from "@/pages/dashboard/ArcWorkspace";
import MvpSettings from "@/pages/dashboard/MvpSettings";
import { resolveDashboardView } from "@/lib/dashboard-release";

import InvestingWorkspace from "@/pages/dashboard/InvestingWorkspace";
import { usePaperBook } from "@/hooks/usePaperBook";
import { INVESTING_VIEWS } from "@/lib/quant";

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
      { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
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
      case "swap":
        return <SwapWorkspace key={search.asset || "default"} initialAddress={search.asset} />;
      case "arc":
        return <ArcWorkspace />;
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
    <WorkspacePreferencesProvider>
      <WorkspaceShell view={view} onNavigate={setView} onInstrument={setSymbol}>
        {renderView()}
      </WorkspaceShell>
    </WorkspacePreferencesProvider>
  );
}
