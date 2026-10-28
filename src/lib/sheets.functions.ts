import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";
import { fullAddress } from "@/lib/orders";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const HEADERS = ["Nom complet", "Numéro de téléphone", "Adresse complète"];

type Api = (path: string, init?: RequestInit) => Promise<any>;

function managedLinked() {
  return Boolean(process.env['GOOGLE_SHEETS_API_KEY'] && process.env['LOVABLE_API_KEY']);
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
  const { getAdmin, ownAccessToken } = await import("@/lib/google-oauth.server");
  const token = await ownAccessToken(await getAdmin());
  if (token) {
    const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const mk = (base: string, label: string): Api => async (path, init) =>
      readJson(await fetch(`${base}${path}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } }), label);
    return { api: mk("https://sheets.googleapis.com/v4", "Google Sheets"), drive: mk("https://www.googleapis.com/drive/v3", "Google Drive"), mode: "own" };
  }
  const lovable = process.env['LOVABLE_API_KEY'];
  const key = process.env['GOOGLE_SHEETS_API_KEY'];
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

function parseSpreadsheetId(input: string): string {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = (m?.[1] ?? input.trim());
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

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

/** Sends new orders (created after activation) that were never synced. Each order is claimed once → no duplicates. */
async function runSync(admin: Admin) {
  const { data: cfg } = await admin.from("google_sheets_config").select("*").eq("id", 1).single();
  if (!cfg?.enabled || !cfg.spreadsheet_id || !cfg.sheet_name || !cfg.enabled_at) {
    return { sent: 0, skipped: true };
  }
  const { data: orders } = await admin
    .from("orders")
    .select("id, customer_name, phone, city, address, created_at")
    .gte("created_at", cfg.enabled_at)
    .order("created_at", { ascending: true })
    .limit(200);
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

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Accès réservé aux administrateurs.");
}

export const getSheetsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: cfg } = await context.supabase.from("google_sheets_config").select("*").eq("id", 1).single();
    const [{ count: synced }, { count: errors }] = await Promise.all([
      context.supabase.from("google_sheets_sync").select("order_id", { count: "exact", head: true }).eq("status", "synced"),
      context.supabase.from("google_sheets_sync").select("order_id", { count: "exact", head: true }).eq("status", "error"),
    ]);
    const { getAdmin, loadOwnOAuth } = await import("@/lib/google-oauth.server");
    const own = await loadOwnOAuth(await getAdmin());
    const ownConnected = !!own.clientId && own.hasSecret && own.hasRefresh;
    const req = getRequest();
    const u = new URL(req.url);
    const fh = u.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
    const origin = fh ? `https://${fh}` : u.origin;
    return {
      linked: ownConnected || managedLinked(),
      mode: ownConnected ? "own" : managedLinked() ? "managed" : null,
      googleEmail: ownConnected ? own.email : null,
      oauthClientId: own.clientId,
      oauthReady: !!own.clientId && own.hasSecret,
      encKeyReady: !!process.env['GOOGLE_TOKEN_ENC_KEY'],
      redirectUris: Array.from(new Set([`${origin}/api/public/google-oauth/callback`, "https://theravene.lovable.app/api/public/google-oauth/callback"])),
      config: cfg ? { ...cfg } : null, synced: synced ?? 0, errors: errors ?? 0,
    };
  });

export const loadSpreadsheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) => ({ url: String(d.url ?? "").slice(0, 500) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const id = parseSpreadsheetId(data.url);
    const { api: gw } = await sheetsApi();
    const meta = await gw(`/spreadsheets/${id}?fields=properties.title,sheets.properties.title`);
    return {
      spreadsheetId: id,
      title: meta.properties?.title as string,
      tabs: ((meta.sheets ?? []) as { properties: { title: string } }[]).map((s) => s.properties.title),
    };
  });

export const saveSheetsConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { spreadsheetId: string; title: string; sheetName: string }) => ({
    spreadsheetId: parseSpreadsheetId(d.spreadsheetId),
    title: String(d.title ?? "").slice(0, 200),
    sheetName: String(d.sheetName ?? "").slice(0, 100),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.sheetName) throw new Error("Choisissez un onglet.");
    const { error } = await context.supabase.from("google_sheets_config").update({
      spreadsheet_id: data.spreadsheetId, spreadsheet_title: data.title, sheet_name: data.sheetName,
      last_test_ok: null, last_test_at: null, last_error: null, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testSheetsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: cfg } = await context.supabase.from("google_sheets_config").select("*").eq("id", 1).single();
    if (!cfg?.spreadsheet_id || !cfg.sheet_name) throw new Error("Choisissez d'abord un fichier et un onglet.");
    const now = new Date().toISOString();
    try {
      const { api: gw } = await sheetsApi();
      await ensureHeaders(gw, cfg.spreadsheet_id, cfg.sheet_name);
      await appendRows(gw, cfg.spreadsheet_id, cfg.sheet_name, [[
        "TEST ORRÉA", "0600000000", `Commande test — ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })}`,
      ]]);
      await context.supabase.from("google_sheets_config").update({ last_test_at: now, last_test_ok: true, last_error: null }).eq("id", 1);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase.from("google_sheets_config").update({ last_test_at: now, last_test_ok: false, last_error: msg }).eq("id", 1);
      return { ok: false, error: msg };
    }
  });

export const setSheetsSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => ({ enabled: Boolean(d.enabled) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: cfg } = await context.supabase.from("google_sheets_config").select("*").eq("id", 1).single();
    if (data.enabled && !cfg?.last_test_ok) throw new Error("Testez la connexion avec succès avant d'activer.");
    const now = new Date().toISOString();
    const patch = data.enabled ? { enabled: true, enabled_at: now, updated_at: now } : { enabled: false, updated_at: now };
    const { error } = await context.supabase.from("google_sheets_config").update(patch).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncSheetsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return runSync(supabaseAdmin);
  });

export const disconnectSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("google_sheets_config").update({
      spreadsheet_id: null, spreadsheet_title: null, sheet_name: null, enabled: false,
      last_test_ok: null, last_test_at: null, last_error: null, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public: called after checkout. Only pushes existing unsynced orders; returns nothing sensitive. */
export const syncNewOrders = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await runSync(supabaseAdmin);
    return { ok: true, sent: r.sent };
  } catch {
    return { ok: false, sent: 0 };
  }
});

export const saveOAuthClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string; clientSecret: string }) => ({
    clientId: String(d.clientId ?? "").trim().slice(0, 200),
    clientSecret: String(d.clientSecret ?? "").trim().slice(0, 200),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!/\.apps\.googleusercontent\.com$/.test(data.clientId)) throw new Error("ID client invalide (doit finir par .apps.googleusercontent.com).");
    if (data.clientSecret.length < 10) throw new Error("Code secret client invalide.");
    const { getAdmin, encrypt } = await import("@/lib/google-oauth.server");
    const admin = await getAdmin();
    await admin.from("google_oauth_secrets").update({ client_secret_enc: await encrypt(data.clientSecret), refresh_token_enc: null, updated_at: new Date().toISOString() }).eq("id", 1);
    await admin.from("google_sheets_config").update({ oauth_client_id: data.clientId, google_email: null, oauth_connected_at: null }).eq("id", 1);
    return { ok: true };
  });

export const startGoogleOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAdmin, loadOwnOAuth, GOOGLE_SCOPES } = await import("@/lib/google-oauth.server");
    const admin = await getAdmin();
    const own = await loadOwnOAuth(admin);
    if (!own.clientId || !own.hasSecret) throw new Error("Enregistrez d'abord l'ID client et le code secret Google.");
    const req = getRequest();
    const u = new URL(req.url);
    const fh = u.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
    const redirectUri = `${fh ? `https://${fh}` : u.origin}/api/public/google-oauth/callback`;
    const state = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
    await admin.from("google_oauth_secrets").update({
      oauth_state: state, oauth_redirect_uri: redirectUri,
      oauth_state_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }).eq("id", 1);
    const p = new URLSearchParams({
      client_id: own.clientId, redirect_uri: redirectUri, response_type: "code",
      scope: GOOGLE_SCOPES.join(" "), access_type: "offline", prompt: "consent select_account",
      include_granted_scopes: "true", state,
    });
    return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${p}` };
  });

export const listSpreadsheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { drive } = await sheetsApi();
    if (!drive) throw new Error("Connectez un compte Google depuis cette page pour lister vos fichiers.");
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const r = await drive(`/files?q=${q}&orderBy=modifiedTime%20desc&pageSize=100&fields=files(id,name,modifiedTime)`);
    return { files: ((r.files ?? []) as { id: string; name: string; modifiedTime: string }[]) };
  });

export const getSpreadsheetTabs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { spreadsheetId: string }) => ({ spreadsheetId: parseSpreadsheetId(String(d.spreadsheetId ?? "")) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { api } = await sheetsApi();
    const meta = await api(`/spreadsheets/${data.spreadsheetId}?fields=properties.title,sheets.properties.title`);
    return {
      spreadsheetId: data.spreadsheetId,
      title: meta.properties?.title as string,
      tabs: ((meta.sheets ?? []) as { properties: { title: string } }[]).map((s) => s.properties.title),
    };
  });

export const disconnectGoogleAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getAdmin, decrypt } = await import("@/lib/google-oauth.server");
    const admin = await getAdmin();
    const { data: sec } = await admin.from("google_oauth_secrets").select("refresh_token_enc").eq("id", 1).single();
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
  });
