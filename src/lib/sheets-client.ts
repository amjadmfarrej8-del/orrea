// Browser caller for the secure Google Sheets endpoint (hosted on Lovable).
// On Vercel, VITE_SHEETS_API_ORIGIN points at the Lovable-published site; elsewhere the current origin is used.
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_SHEETS_ACTIONS, SHEETS_API_PATH } from "@/lib/sheets-api";
import type { adminActions } from "@/lib/sheets-core.server";

type Admin = typeof adminActions;
export type SheetsAction = keyof Admin | "sync-new-orders";
type Input<A> = A extends keyof Admin ? Parameters<Admin[A]>[0]["data"] : Record<string, never>;
type Output<A> = A extends keyof Admin ? Awaited<ReturnType<Admin[A]>> : { ok: boolean; sent: number };

export function sheetsApiOrigin(): string {
  const configured = import.meta.env["VITE_SHEETS_API_ORIGIN"] as string | undefined;
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fall through */ }
  }
  return window.location.origin;
}

export async function callSheets<A extends SheetsAction>(action: A, data?: Input<A>): Promise<Output<A>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!PUBLIC_SHEETS_ACTIONS.has(action)) {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) throw new Error("Session expirée : reconnectez-vous.");
    headers["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${sheetsApiOrigin()}${SHEETS_API_PATH}/${action}`, {
      method: "POST", headers, body: JSON.stringify(data ?? {}), credentials: "omit",
    });
  } catch {
    throw new Error("Service Google Sheets injoignable. Vérifiez votre connexion ou la configuration du site.");
  }
  const text = await res.text();
  let body: any;
  try { body = text ? JSON.parse(text) : {}; } catch { throw new Error(`Service Google Sheets indisponible (${res.status}).`); }
  if (!res.ok) throw new Error(body?.error ?? `Erreur Google Sheets (${res.status}).`);
  return body as Output<A>;
}
