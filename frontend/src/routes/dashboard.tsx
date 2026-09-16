import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { view?: string } => ({
    view: typeof search["view"] === "string" ? search["view"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ARCWELL — Investing & Research" },
      {
        name: "description",
        content:
          "Explore paper investing, interactive market charts, risk models, Arc Testnet tools and the evidence registry.",
      },
      { property: "og:title", content: "ARCWELL — Investing & Research" },
      {
        property: "og:description",
        content: "Portfolio research, paper trading, quantitative models and Arc Testnet tools.",
      },
    ],
  }),
  loader: async () => {
    await import("@/data/dashboard");
  },
  component: Dashboard,
});
