import { createFileRoute } from "@tanstack/react-router";

// Serves product images from private storage.
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!/^[\w\-./]+$/.test(path) || path.includes("..")) return new Response("Bad path", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: { "content-type": data.type || "image/jpeg", "cache-control": "public, max-age=86400" },
        });
      },
    },
  },
});
