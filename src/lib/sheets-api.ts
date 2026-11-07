// Browser-safe rules shared by the Google Sheets endpoint and its callers.
export const SHEETS_API_PATH = "/api/public/sheets";

/** Callable without a session; must never return private data. */
export const PUBLIC_SHEETS_ACTIONS = new Set(["sync-new-orders"]);

const DEFAULT_ALLOWED = [
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/orrea(-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/(www\.)?orrea\.ma$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

/** Published Lovable host that runs the privileged Sheets endpoint. */
export const DEFAULT_SHEETS_API_ORIGIN = "https://orrea.lovable.app";

/** Lovable hosts and localhost serve the endpoint themselves; any other host (Vercel, orrea.ma) calls the Lovable host. */
export function resolveSheetsApiOrigin(configured: string | undefined, current: string): string {
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fall through */ }
  }
  try {
    const host = new URL(current).hostname;
    if (host === "localhost" || /(^|\.)lovable\.app$/i.test(host) || /(^|\.)lovableproject\.com$/i.test(host)) return new URL(current).origin;
  } catch { /* fall through */ }
  return DEFAULT_SHEETS_API_ORIGIN;
}

/** Extra origins (custom Vercel domains) come from a comma-separated server setting. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => {
      try {
        const u = new URL(s);
        return u.protocol === "https:" ? [u.origin] : [];
      } catch {
        return [];
      }
    });
}

export function isAllowedOrigin(origin: string | null, extra: string[] = []): boolean {
  if (!origin) return false;
  return extra.includes(origin) || DEFAULT_ALLOWED.some((re) => re.test(origin));
}

export function corsHeaders(origin: string | null, extra: string[] = []): Record<string, string> {
  const h: Record<string, string> = { Vary: "Origin" };
  if (origin && isAllowedOrigin(origin, extra)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}

/** Returns the bearer token, or null when absent/malformed. */
export function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.split(".").length === 3 ? token : null;
}

/** The public post-order call only ever reveals whether it ran and how many rows were sent. */
export function publicSyncResult(r: unknown): { ok: boolean; sent: number } {
  const sent = typeof (r as { sent?: unknown })?.sent === "number" ? (r as { sent: number }).sent : 0;
  return { ok: true, sent };
}
