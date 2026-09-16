import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveDashboardView } from "@/lib/dashboard-release";
import { isAssetAddress } from "../../../src/asset-data";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { view?: string; asset?: string } => ({
    asset:
      typeof search["asset"] === "string" && isAssetAddress(search["asset"])
        ? search["asset"].toLowerCase()
        : undefined,
    view: typeof search["view"] === "string" ? search["view"] : undefined,
  }),
  beforeLoad: ({ search }) => {
    const view = resolveDashboardView(search.view);
    if (search.view && search.view !== view) {
      throw redirect({
        to: "/dashboard",
        search: view === "portfolio" ? {} : { view },
        replace: true,
      });
    }
  },
  head: () => ({
    meta: [
      { title: "ARCWELL — Investing & Research" },
      {
        name: "description",
        content:
          "Explore Arc markets, prepare Uniswap swaps, practice paper trading, and inspect wallet balances and receipts.",
      },
      { property: "og:title", content: "ARCWELL — Investing & Research" },
      {
        property: "og:description",
        content:
          "Markets, paper portfolios and live Arc network reads. Real stock execution is not yet connected.",
      },
    ],
  }),
  loader: async () => {
    await import("@/data/dashboard");
  },
  component: Dashboard,
});
