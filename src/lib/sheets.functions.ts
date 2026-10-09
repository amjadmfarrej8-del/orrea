import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fullAddress } from "@/lib/orders";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const HEADERS = ["Nom complet", "Numéro de téléphone", "Adresse complète"];

function accountLinked() {
  return Boolean(process.env.GOOGLE_SHEETS_API_KEY && process.env.LOVABLE_API_KEY);
}

async function gw(path: string, init?: RequestInit) {
  const lovable = process.env.LOVABLE_API_KEY;
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovable || !key) throw new Error("Compte Google non relié.");
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": key,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Google Sheets [${res.status}]: ${text}`);
    let msg = text;
    try { msg = JSON.parse(text)?.error?.message ?? text; } catch { /* keep text */ }
    throw new Error(`Google Sheets (${res.status}) : ${msg.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

const rangeFor = (sheet: string, cells: string) =>
  `${encodeURIComponent(`'${sheet.replace(/'/g, "''")}'`)}!${cells}`;

function parseSpreadsheetId(input: string) {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = m ? m[1] : input.trim();
  if (!/^[a-zA-Z0-9-_]{20,}$/.test(id)) throw new Error("Lien Google Sheets invalide.");
  return id;
}

async function ensureHeaders(spreadsheetId: string, sheet: string) {
  const r = await gw(`/spreadsheets/${spreadsheetId}/values/${rangeFor(sheet, "A1:C1")}`);
  const first = (r.values?.[0] ?? []) as string[];
  if (first.length === 0) {
    await gw(`/spreadsheets/${spreadsheetId}/values/${rangeFor(sheet, "A1:C1")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [HEADERS] }),
    });
  }
}

async function appendRows(spreadsheetId: string, sheet: string, rows: string[][]) {
  await gw(
    `/spreadsheets/${spreadsheetId}/values/${rangeFor(sheet, "A:C")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: rows }) },
  );
}

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

/** Sends new orders (created after activation) that were never synced. Each order is claimed once → no duplicates. */
async function runSync(admin: Admin) {
  const { data: cfg } = await admin.from("google_sheets_config").select("*").eq("id", 1).single();
  if (!cfg?.enabled || !cfg.spreadsheet_id || !cfg.sheet_name || !cfg.enabled_at || !accountLinked()) {
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
    await ensureHeaders(cfg.spreadsheet_id, cfg.sheet_name);
    await appendRows(
      cfg.spreadsheet_id,
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
    return { linked: accountLinked(), config: cfg, synced: synced ?? 0, errors: errors ?? 0 };
  });

export const loadSpreadsheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) => ({ url: String(d.url ?? "").slice(0, 500) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const id = parseSpreadsheetId(data.url);
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
      await ensureHeaders(cfg.spreadsheet_id, cfg.sheet_name);
      await appendRows(cfg.spreadsheet_id, cfg.sheet_name, [[
        "TEST THÉRAVÈNE", "0600000000", `Commande test — ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })}`,
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
    const patch: Record<string, unknown> = { enabled: data.enabled, updated_at: new Date().toISOString() };
    if (data.enabled) patch.enabled_at = new Date().toISOString();
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
