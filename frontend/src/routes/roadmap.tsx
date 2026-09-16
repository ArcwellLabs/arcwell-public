import { createFileRoute } from "@tanstack/react-router";
import Roadmap from "@/pages/Roadmap";
export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — ARCWELL" },
      {
        name: "description",
        content:
          "Explore ARCWELL's roadmap from live Arc research and paper investing to connected investing, portfolio intelligence and advanced research.",
      },
      { property: "og:title", content: "ARCWELL — The road ahead" },
    ],
  }),
  component: Roadmap,
});
