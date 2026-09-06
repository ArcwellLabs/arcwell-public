import { createFileRoute } from "@tanstack/react-router";
import Studio from "@/pages/Studio";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "The Studio — ARCWELL Verification Architecture" },
      {
        name: "description",
        content:
          "How ARCWELL structures records, evidence and audit boundaries — the architecture behind transaction-proof verification.",
      },
      { property: "og:title", content: "The Studio — ARCWELL Verification Architecture" },
      {
        property: "og:description",
        content: "The architecture behind ARCWELL's transaction-proof verification.",
      },
    ],
  }),
  component: Studio,
});
