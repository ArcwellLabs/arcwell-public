import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveDashboardView } from "@/lib/dashboard-release";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { view?: string } => ({
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
          "Explore markets, practice paper trading and track your sample portfolio in the ARCWELL beta.",
      },
      { property: "og:title", content: "ARCWELL — Investing & Research" },
      {
        property: "og:description",
        content:
          "Markets, portfolio charts, paper orders and activity. Synthetic data; no real execution.",
      },
    ],
  }),
  loader: async () => {
    await import("@/data/dashboard");
  },
  component: Dashboard,
});
