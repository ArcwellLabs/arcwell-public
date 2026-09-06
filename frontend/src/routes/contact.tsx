import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ARCWELL — Start a Verification Engagement" },
      {
        name: "description",
        content:
          "Talk to ARCWELL about anchoring evidence, audit trails and record verification for your organization.",
      },
      { property: "og:title", content: "Contact ARCWELL — Start a Verification Engagement" },
      {
        property: "og:description",
        content: "Talk to ARCWELL about evidence anchoring and record verification.",
      },
    ],
  }),
  component: Contact,
});
