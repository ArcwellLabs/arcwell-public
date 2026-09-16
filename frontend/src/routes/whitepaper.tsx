import { createFileRoute } from "@tanstack/react-router";
import Whitepaper from "@/pages/Whitepaper";
export const Route = createFileRoute("/whitepaper")({
  head: () => ({
    meta: [
      { title: "Whitepaper — ARCWELL" },
      {
        name: "description",
        content:
          "ARCWELL's product thesis, current architecture, trust boundaries and delivery roadmap.",
      },
    ],
  }),
  component: Whitepaper,
});
