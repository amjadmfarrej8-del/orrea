import { createFileRoute } from "@tanstack/react-router";
import { bearerToken, corsHeaders, parseAllowedOrigins, PUBLIC_SHEETS_ACTIONS, publicSyncResult } from "@/lib/sheets-api";

// Secure Google Sheets endpoint hosted on the Lovable runtime. Administrator actions require a
// valid session token plus the admin role; the public action returns only { ok, sent }.
function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/sheets/$action")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin"), parseAllowedOrigins(process.env["SHEETS_ALLOWED_ORIGINS"])) }),
      POST: async ({ request, params }) => {
        const cors = corsHeaders(request.headers.get("origin"), parseAllowedOrigins(process.env["SHEETS_ALLOWED_ORIGINS"]));
        const action = String(params.action ?? "");

        if (PUBLIC_SHEETS_ACTIONS.has(action)) {
          try {
            const { syncNewOrdersPublic } = await import("@/lib/sheets-core.server");
            return json(publicSyncResult(await syncNewOrdersPublic()), 200, cors);
          } catch (e) {
            console.error("sheets public sync", e);
            return json({ ok: false, sent: 0 }, 200, cors);
          }
        }

        const { adminActions, verifyAdmin, SheetsHttpError } = await import("@/lib/sheets-core.server");
        if (!Object.prototype.hasOwnProperty.call(adminActions, action)) return json({ error: "Action inconnue." }, 404, cors);
        const token = bearerToken(request.headers.get("authorization"));
        if (!token) return json({ error: "Session expirée : reconnectez-vous." }, 401, cors);

        let data: Record<string, unknown> = {};
        try {
          const text = await request.text();
          if (text.length > 10_000) return json({ error: "Requête trop volumineuse." }, 413, cors);
          const parsed = text ? JSON.parse(text) : {};
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
        } catch {
          return json({ error: "Requête invalide." }, 400, cors);
        }

        try {
          const user = await verifyAdmin(token);
          const fn = adminActions[action as keyof typeof adminActions] as (ctx: { data: Record<string, unknown>; user: typeof user; request: Request }) => Promise<unknown>;
          return json(await fn({ data, user, request }), 200, cors);
        } catch (e) {
          if (e instanceof SheetsHttpError) return json({ error: e.message }, e.status, cors);
          console.error(`sheets ${action}`, e);
          return json({ error: e instanceof Error ? e.message : "Erreur Google Sheets." }, 400, cors);
        }
      },
    },
  },
});
