import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/stock-trading")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("../server/stock-trading")).handleStockTrading(request),
      POST: async ({ request }) =>
        (await import("../server/stock-trading")).handleStockTrading(request),
    },
  },
});
