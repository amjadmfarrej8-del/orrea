// Server-only Google Sheets operations. Runs on the Lovable-hosted runtime, which has the
// managed privileged backend access and the token-encryption key. Never import from browser code.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fullAddress } from "@/lib/orders";
import { googleCallbackUrl } from "@/lib/google-oauth-origin";
import { requireSavedRow, syncActivation } from "@/lib/sheets-state";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const HEADERS = ["Nom complet", "Numéro de téléphone", "Adresse complète"];

type Api = (path: string, init?: RequestInit) => Promise<any>;
type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
export type AdminUser = { supabase: SupabaseClient<Database>; userId: string };
type Ctx<D = Record<string, unknown>> = { data: D; user: AdminUser; request: Request };

export class SheetsHttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function managedLinked() {
  return Boolean(process.env["GOOGLE_SHEETS_API_KEY"] && process.env["LOVABLE_API_KEY"]);
}

async function getAdmin(): Promise<Admin> {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Verifies the caller's session and administrator role with an RLS-scoped client. */
export async function verifyAdmin(token: string): Promise<AdminUser> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new SheetsHttpError(500, "Configuration du serveur incomplète.");
  const supabase = createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) throw new SheetsHttpError(401, "Session expirée : reconnectez-vous.");
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new SheetsHttpError(403, "Accès réservé aux administrateurs.");
  return { supabase, userId };
}

async function readJson(res: Response, label: string) {
  const text = await res.text();
  if (!res.ok) {
    console.error(`${label} [${res.status}]: ${text}`);
    let msg = text;
    try { msg = JSON.parse(text)?.error?.message ?? text; } catch { /* keep text */ }
    throw new Error(`${label} (${res.status}) : ${String(msg).slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

/** Own Google account (OAuth) first; falls back to the managed connection. */
async function sheetsApi(): Promise<{ api: Api; drive: Api | null; mode: "own" | "managed" }> {
  const { ownAccessToken } = await import("@/lib/google-oauth.server");
  const token = await ownAccessToken(await getAdmin());
  if (token) {
    const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const mk = (base: string, label: string): Api => async (path, init) =>
      readJson(await fetch(`${base}${path}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } }), label);
    return { api: mk("https://sheets.googleapis.com/v4", "Google Sheets"), drive: mk("https://www.googleapis.com/drive/v3", "Google Drive"), mode: "own" };
  }
  const lovable = process.env["LOVABLE_API_KEY"];
  const key = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovable || !key) throw new Error("Aucun compte Google connecté.");
  const api: Api = async (path, init) =>
    readJson(await fetch(`${GATEWAY_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": key, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    }), "Google Sheets");
  return { api, drive: null, mode: "managed" };
}

const rangeFor = (sheet: string, cells: string) =>
  `${encodeURIComponent(`'${sheet.replace(/'/g, "''")}'`)}!${cells}`;

function parseSpreadsheetId(input: unknown): string {
  const s = String(input ?? "").slice(0, 500);
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = (m?.[1] ?? s.trim());
  if (!/^[a-zA-Z0-9-_]{20,}$/.test(id)) throw new Error("Lien Google Sheets invalide.");
  return id;
}

async function ensureHeaders(gw: Api, spreadsheetId: string, sheet: string) {
  const r = await gw(`/spreadsheets/${spreadsheetId}/values/${rangeFor(sheet, "A1:C1")}`);
  const first = (r.values?.[0] ?? []) as string[];
  if (first.length === 0) {
    await gw(`/spreadsheets/${spreadsheetId}/values/${rangeFor(sheet, "A1:C1")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [HEADERS] }),
    });
  }
}

async function appendRows(gw: Api, spreadsheetId: string, sheet: string, rows: string[][]) {
  await gw(
    `/spreadsheets/${spreadsheetId}/values/${rangeFor(sheet, "A:C")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: rows }) },
  );
}

/** Sends new orders (created after activation) that were never synced. Each order is claimed once → no duplicates. */
async function runSync(admin: Admin) {
  const { data: cfg } = await admin.from("google_sheets_config").select("*").eq("id", 1).maybeSingle();
  if (!cfg?.enabled || !cfg.spreadsheet_id || !cfg.sheet_name || !cfg.enabled_at) {
    return { sent: 0, skipped: true };
  }
  const { data: alreadySent, error: ledgerError } = await admin.from("google_sheets_sync").select("order_id").eq("status", "synced");
  if (ledgerError) throw new Error(ledgerError.message);
  let eligibleOrders = admin
    .from("orders")
    .select("id, customer_name, phone, city, address, created_at")
    .gte("created_at", cfg.enabled_at);
  if (alreadySent?.length) eligibleOrders = eligibleOrders.not("id", "in", `(${alreadySent.map((row) => row.order_id).join(",")})`);
  const { data: orders, error: ordersError } = await eligibleOrders
    .order("created_at", { ascending: true })
    .limit(200);
  if (ordersError) throw new Error(ordersError.message);
  if (!orders?.length) return { sent: 0, skipped: false };
  const { data: done } = await admin
    .from("google_sheets_sync")
    .select("order_id, status, updated_at")
    .in("order_id", (orders ?? []).map((o) => o.id));
  const doneMap = new Map((done ?? []).map((d) => [d.order_id, d]));
  const stale = Date.now() - 5 * 60 * 1000;

  const claimed: typeof orders = [];
  for (const o of orders ?? []) {
    const d = doneMap.get(o.id);
    if (!d) {
      const { error } = await admin.from("google_sheets_sync").insert({ order_id: o.id, status: "pending", attempts: 1 });
      if (!error) claimed.push(o);
    } else if (d.status === "error" || (d.status === "pending" && new Date(d.updated_at).getTime() < stale)) {
      const { data: upd } = await admin
        .from("google_sheets_sync")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("order_id", o.id)
        .eq("updated_at", d.updated_at)
        .select("order_id");
      if (upd?.length) claimed.push(o);
    }
  }
  if (claimed.length === 0) return { sent: 0, skipped: false };

  const ids = claimed.map((o) => o.id);
  const now = new Date().toISOString();
  try {
    const { api: gw } = await sheetsApi();
    await ensureHeaders(gw, cfg.spreadsheet_id, cfg.sheet_name);
    await appendRows(
      gw, cfg.spreadsheet_id,
      cfg.sheet_name,
      claimed.map((o) => [o.customer_name ?? "", o.phone ?? "", fullAddress(o.city, o.address)]),
    );
    await admin.from("google_sheets_sync").update({ status: "synced", error: null, synced_at: now, updated_at: now }).in("order_id", ids);
    await admin.from("google_sheets_config").update({ last_sync_at: now, last_error: null }).eq("id", 1);
    return { sent: claimed.length, skipped: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("google_sheets_sync").update({ status: "error", error: msg, updated_at: now }).in("order_id", ids);
    await admin.from("google_sheets_config").update({ last_error: msg }).eq("id", 1);
    throw new Error(msg);
  }
}

function callbackUrl(request: Request) {
  return googleCallbackUrl(request, {
    VERCEL: process.env["VERCEL"], GOOGLE_OAUTH_ORIGIN: process.env["GOOGLE_OAUTH_ORIGIN"],
    VERCEL_URL: process.env["VERCEL_URL"], VERCEL_PROJECT_PRODUCTION_URL: process.env["VERCEL_PROJECT_PRODUCTION_URL"],
  });
}

async function getStatus({ user, request }: Ctx) {
  const { supabase } = user;
  const { data: cfg, error: configError } = await supabase.from("google_sheets_config").select("*").eq("id", 1).maybeSingle();
  if (configError) throw new Error(`Configuration Google Sheets : ${configError.message}`);
  const [{ count: synced }, { count: errors }] = await Promise.all([
    supabase.from("google_sheets_sync").select("order_id", { count: "exact", head: true }).eq("status", "synced"),
    supabase.from("google_sheets_sync").select("order_id", { count: "exact", head: true }).eq("status", "error"),
  ]);
  const { loadOwnOAuth } = await import("@/lib/google-oauth.server");
  const own = await loadOwnOAuth(await getAdmin());
  const ownConnected = !!own.clientId && own.hasSecret && own.hasRefresh;
  return {
    linked: ownConnected || managedLinked(),
    mode: (ownConnected ? "own" : managedLinked() ? "managed" : null) as "own" | "managed" | null,
    googleEmail: ownConnected ? own.email : null,
    oauthClientId: own.clientId,
    oauthReady: !!own.clientId && own.hasSecret,
    encKeyReady: !!process.env["GOOGLE_TOKEN_ENC_KEY"],
    redirectUris: [callbackUrl(request)],
    config: cfg ? { ...cfg } : null, synced: synced ?? 0, errors: errors ?? 0,
  };
}

async function sheetMeta(id: string) {
  const { api } = await sheetsApi();
  const meta = await api(`/spreadsheets/${id}?fields=properties.title,sheets.properties.title`);
  return {
    spreadsheetId: id,
    title: meta.properties?.title as string,
    tabs: ((meta.sheets ?? []) as { properties: { title: string } }[]).map((s) => s.properties.title),
  };
}

async function loadSpreadsheet({ data }: Ctx<{ url?: unknown }>) {
  return sheetMeta(parseSpreadsheetId(data.url));
}

async function getSpreadsheetTabs({ data }: Ctx<{ spreadsheetId?: unknown }>) {
  return sheetMeta(parseSpreadsheetId(data.spreadsheetId));
}

async function saveSheetsConfig({ data, user }: Ctx<{ spreadsheetId?: unknown; title?: unknown; sheetName?: unknown }>) {
  const spreadsheetId = parseSpreadsheetId(data.spreadsheetId);
  const title = String(data.title ?? "").slice(0, 200);
  const sheetName = String(data.sheetName ?? "").slice(0, 100);
  if (!sheetName) throw new Error("Choisissez un onglet.");
  const saved = await user.supabase.from("google_sheets_config").update({
    spreadsheet_id: spreadsheetId, spreadsheet_title: title, sheet_name: sheetName,
    last_test_ok: null, last_test_at: null, last_error: null, updated_at: new Date().toISOString(),
  }).eq("id", 1).select("id").single();
  requireSavedRow(saved, "Enregistrement du fichier");
  return { ok: true };
}

async function testSheetsConnection({ user }: Ctx) {
  const { data: cfg } = await user.supabase.from("google_sheets_config").select("*").eq("id", 1).maybeSingle();
  if (!cfg?.spreadsheet_id || !cfg.sheet_name) throw new Error("Choisissez d'abord un fichier et un onglet.");
  const now = new Date().toISOString();
  try {
    const { api: gw } = await sheetsApi();
    await ensureHeaders(gw, cfg.spreadsheet_id, cfg.sheet_name);
    await appendRows(gw, cfg.spreadsheet_id, cfg.sheet_name, [[
      "TEST ORRÉA", "0600000000", `Commande test — ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })}`,
    ]]);
    await user.supabase.from("google_sheets_config").update({ last_test_at: now, last_test_ok: true, last_error: null }).eq("id", 1);
    return { ok: true as const, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await user.supabase.from("google_sheets_config").update({ last_test_at: now, last_test_ok: false, last_error: msg }).eq("id", 1);
    return { ok: false as const, error: msg };
  }
}

async function setSheetsSync({ data, user }: Ctx<{ enabled?: unknown }>) {
  const enabled = Boolean(data.enabled);
  const { data: cfg } = await user.supabase.from("google_sheets_config").select("*").eq("id", 1).maybeSingle();
  if (enabled && !cfg?.last_test_ok) throw new Error("Testez la connexion avec succès avant d'activer.");
  const now = new Date().toISOString();
  const patch = syncActivation(enabled, cfg?.enabled_at, now);
  const { error } = await user.supabase.from("google_sheets_config").update(patch).eq("id", 1);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function syncSheetsNow(_: Ctx) {
  return runSync(await getAdmin());
}

async function disconnectSheets({ user }: Ctx) {
  const { error } = await user.supabase.from("google_sheets_config").update({
    spreadsheet_id: null, spreadsheet_title: null, sheet_name: null, enabled: false,
    last_test_ok: null, last_test_at: null, last_error: null, updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function saveOAuthClient({ data }: Ctx<{ clientId?: unknown; clientSecret?: unknown }>) {
  const clientId = String(data.clientId ?? "").trim().slice(0, 200);
  const clientSecret = String(data.clientSecret ?? "").trim().slice(0, 200);
  if (!/\.apps\.googleusercontent\.com$/.test(clientId)) throw new Error("ID client invalide (doit finir par .apps.googleusercontent.com).");
  if (clientSecret.length < 10) throw new Error("Code secret client invalide.");
  const { encrypt } = await import("@/lib/google-oauth.server");
  const admin = await getAdmin();
  const encryptedSecret = await encrypt(clientSecret);
  const configWrite = await admin.from("google_sheets_config").upsert({ id: 1, oauth_client_id: clientId }, { onConflict: "id" }).select("id").single();
  requireSavedRow(configWrite, "Enregistrement du client Google");
  const secretWrite = await admin.from("google_oauth_secrets").upsert({ id: 1, client_secret_enc: encryptedSecret, updated_at: new Date().toISOString() }, { onConflict: "id" }).select("id").single();
  requireSavedRow(secretWrite, "Enregistrement des identifiants Google");
  return { ok: true };
}

async function startGoogleOAuth({ request }: Ctx) {
  const { loadOwnOAuth, GOOGLE_SCOPES } = await import("@/lib/google-oauth.server");
  const admin = await getAdmin();
  const own = await loadOwnOAuth(admin);
  if (!own.clientId || !own.hasSecret) throw new Error("Enregistrez d'abord l'ID client et le code secret Google.");
  const redirectUri = callbackUrl(request);
  const state = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
  const stateWrite = await admin.from("google_oauth_secrets").update({
    oauth_state: state, oauth_redirect_uri: redirectUri,
    oauth_state_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }).eq("id", 1).select("id").single();
  requireSavedRow(stateWrite, "Enregistrement de la connexion Google");
  const p = new URLSearchParams({
    client_id: own.clientId, redirect_uri: redirectUri, response_type: "code",
    scope: GOOGLE_SCOPES.join(" "), access_type: "offline", prompt: "consent select_account",
    include_granted_scopes: "true", state,
  });
  return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${p}` };
}

async function listSpreadsheets(_: Ctx) {
  const { drive } = await sheetsApi();
  if (!drive) throw new Error("Connectez un compte Google depuis cette page pour lister vos fichiers.");
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const r = await drive(`/files?q=${q}&orderBy=modifiedTime%20desc&pageSize=100&fields=files(id,name,modifiedTime)`);
  return { files: ((r.files ?? []) as { id: string; name: string; modifiedTime: string }[]) };
}

async function disconnectGoogleAccount(_: Ctx) {
  const { decrypt } = await import("@/lib/google-oauth.server");
  const admin = await getAdmin();
  const { data: sec } = await admin.from("google_oauth_secrets").select("refresh_token_enc").eq("id", 1).maybeSingle();
  if (sec?.refresh_token_enc) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(await decrypt(sec.refresh_token_enc))}`, { method: "POST" });
    } catch { /* ignore */ }
  }
  await admin.from("google_oauth_secrets").update({ refresh_token_enc: null }).eq("id", 1);
  await admin.from("google_sheets_config").update({
    google_email: null, oauth_connected_at: null, enabled: false, last_test_ok: null,
  }).eq("id", 1);
  return { ok: true };
}

/** Administrator actions: every call is preceded by verifyAdmin in the endpoint. */
export const adminActions = {
  "status": getStatus,
  "load-spreadsheet": loadSpreadsheet,
  "spreadsheet-tabs": getSpreadsheetTabs,
  "save-config": saveSheetsConfig,
  "test": testSheetsConnection,
  "set-sync": setSheetsSync,
  "sync-now": syncSheetsNow,
  "disconnect": disconnectSheets,
  "save-oauth-client": saveOAuthClient,
  "start-oauth": startGoogleOAuth,
  "list-spreadsheets": listSpreadsheets,
  "disconnect-google": disconnectGoogleAccount,
};

/** Public post-order sync: only pushes existing unsynced orders. */
export async function syncNewOrdersPublic() {
  return runSync(await getAdmin());
}
