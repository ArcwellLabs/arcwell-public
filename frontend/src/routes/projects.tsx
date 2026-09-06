import { createFileRoute } from "@tanstack/react-router";
import Projects from "@/pages/Projects";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Records — ARCWELL Verified Transaction Proofs" },
      {
        name: "description",
        content:
          "Browse anchored records and verification proofs registered through ARCWELL's transaction-proof infrastructure.",
      },
      { property: "og:title", content: "Records — ARCWELL Verified Transaction Proofs" },
      {
        property: "og:description",
        content: "Anchored records and verification proofs registered through ARCWELL.",
      },
    ],
  }),
  loader: async () => {
    await import("@/data/projects");
  },
  component: Projects,
});
