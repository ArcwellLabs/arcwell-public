import { createFileRoute } from "@tanstack/react-router";
import Articles from "@/pages/Articles";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Field Notes — ARCWELL Verification Writing" },
      {
        name: "description",
        content:
          "Essays and field notes on evidence anchoring, audit trails and verifiable records from the ARCWELL team.",
      },
      { property: "og:title", content: "Field Notes — ARCWELL Verification Writing" },
      {
        property: "og:description",
        content: "Essays on evidence anchoring, audit trails and verifiable records.",
      },
    ],
  }),
  loader: async () => {
    await import("@/data/articles");
  },
  component: Articles,
});
