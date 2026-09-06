import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { view?: string } => ({
    view: typeof search["view"] === "string" ? search["view"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ARCWELL Console — Records, Evidence & Verifiers" },
      {
        name: "description",
        content:
          "Explore the ARCWELL console: record series, transactions, evidence, verifiers, corrections and API rewards.",
      },
      { property: "og:title", content: "ARCWELL Console — Records, Evidence & Verifiers" },
      {
        property: "og:description",
        content: "Record series, transactions, evidence, verifiers and corrections in one console.",
      },
    ],
  }),
  loader: async () => {
    await import("@/data/dashboard");
  },
  component: Dashboard,
});
