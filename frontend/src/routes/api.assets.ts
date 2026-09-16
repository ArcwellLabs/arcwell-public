import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/assets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleAssetRequest } = await import("../server/asset-api");
        return handleAssetRequest(request);
      },
    },
  },
});
