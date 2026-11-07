import { describe, expect, it } from "vitest";
import { bearerToken, corsHeaders, isAllowedOrigin, parseAllowedOrigins, PUBLIC_SHEETS_ACTIONS, publicSyncResult } from "@/lib/sheets-api";

describe("secure Google Sheets endpoint rules", () => {
  it("only the post-order sync is callable without a session", () => {
    expect([...PUBLIC_SHEETS_ACTIONS]).toEqual(["sync-new-orders"]);
    for (const a of ["status", "start-oauth", "save-oauth-client", "sync-now", "disconnect-google"]) expect(PUBLIC_SHEETS_ACTIONS.has(a)).toBe(false);
  });

  it("rejects missing or malformed session tokens", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken("Bearer sb_publishable_key")).toBeNull();
    expect(bearerToken("Bearer a.b.c")).toBe("a.b.c");
  });

  it("the public sync reveals only ok and the sent count", () => {
    expect(publicSyncResult({ sent: 3, skipped: false, secret: "x" })).toEqual({ ok: true, sent: 3 });
    expect(publicSyncResult(null)).toEqual({ ok: true, sent: 0 });
  });

  it("allows the Lovable and Vercel storefront origins", () => {
    for (const o of ["https://orrea.lovable.app", "https://id-preview--abc.lovable.app", "https://orrea.vercel.app", "https://orrea-git-main-team.vercel.app"]) {
      expect(isAllowedOrigin(o)).toBe(true);
    }
  });

  it("refuses other origins unless explicitly configured", () => {
    expect(isAllowedOrigin("https://attacker.vercel.app")).toBe(false);
    expect(isAllowedOrigin("https://evil.lovable.app.attacker.com")).toBe(false);
    expect(corsHeaders("https://attacker.example")["Access-Control-Allow-Origin"]).toBeUndefined();
    const extra = parseAllowedOrigins("https://orrea.ma, http://insecure.example, not a url");
    expect(extra).toEqual(["https://orrea.ma"]);
    expect(corsHeaders("https://orrea.ma", extra)["Access-Control-Allow-Origin"]).toBe("https://orrea.ma");
  });
});
