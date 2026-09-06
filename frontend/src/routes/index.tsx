import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARCWELL® — Anchor Evidence & Verify Records on ARC" },
      {
        name: "description",
        content:
          "Anchor evidence, preserve immutable audit trails, and verify records in seconds with ARCWELL's transaction-proof infrastructure built on ARC.",
      },
      { property: "og:title", content: "ARCWELL® — Anchor Evidence & Verify Records on ARC" },
      {
        property: "og:description",
        content:
          "Anchor evidence, preserve immutable audit trails, and verify records in seconds with ARCWELL's transaction-proof infrastructure built on ARC.",
      },
      { property: "og:image", content: "https://example.com/og-hero.jpg" },
      { name: "twitter:image", content: "https://example.com/og-hero.jpg" },
    ],
  }),
  component: Home,
});
