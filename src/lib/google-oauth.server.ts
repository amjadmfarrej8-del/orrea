// Server-only: Google OAuth (own client) token storage and refresh.
type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

async function aesKey() {
  const raw = process.env["GOOGLE_TOKEN_ENC_KEY"];
  if (!raw) throw new Error("Clé de chiffrement manquante (GOOGLE_TOKEN_ENC_KEY).");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return b64(out);
}
export async function decrypt(stored: string) {
  const buf = unb64(stored);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.subarray(0, 12) }, await aesKey(), buf.subarray(12));
  return new TextDecoder().decode(pt);
}

export async function getAdmin(): Promise<Admin> {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export async function loadOwnOAuth(admin: Admin) {
  const [{ data: cfg, error: configError }, { data: sec, error: secretError }] = await Promise.all([
    admin.from("google_sheets_config").select("oauth_client_id, google_email").eq("id", 1).maybeSingle(),
    admin.from("google_oauth_secrets").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (configError) throw new Error(`Configuration Google Sheets indisponible : ${configError.message}`);
  if (secretError) throw new Error(`Configuration Google OAuth indisponible : ${secretError.message}`);
  return {
    clientId: cfg?.oauth_client_id ?? null,
    email: cfg?.google_email ?? null,
    hasSecret: !!sec?.client_secret_enc,
    hasRefresh: !!sec?.refresh_token_enc,
    sec,
  };
}

export async function exchangeToken(body: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string; access_token?: string; refresh_token?: string };
  if (!res.ok) {
    if (json.error === "invalid_grant") throw new Error("Accès Google expiré ou retiré : reconnectez votre compte Google.");
    throw new Error(`Google OAuth (${res.status}) : ${json.error_description ?? json.error ?? "erreur"}`);
  }
  return json;
}

/** Returns a fresh access token for the own OAuth connection, or null if not connected. */
export async function ownAccessToken(admin: Admin): Promise<string | null> {
  const o = await loadOwnOAuth(admin);
  if (!o.clientId || !o.sec?.client_secret_enc || !o.sec?.refresh_token_enc) return null;
  const tok = await exchangeToken({
    grant_type: "refresh_token",
    client_id: o.clientId,
    client_secret: await decrypt(o.sec.client_secret_enc),
    refresh_token: await decrypt(o.sec.refresh_token_enc),
  });
  return tok.access_token ?? null;
}
