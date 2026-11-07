import { describe, expect, it } from "vitest";
import { googleCallbackUrl } from "@/lib/google-oauth-origin";

describe("Google Sheets production callback compatibility", () => {
  it("uses the Vercel production origin instead of the old brand domain", () => {
    expect(googleCallbackUrl(new Request("https://orrea.vercel.app/admin/sheets"))).toBe("https://orrea.vercel.app/api/public/google-oauth/callback");
  });
  it("preserves the Lovable callback", () => {
    expect(googleCallbackUrl(new Request("https://orrea.lovable.app/admin/sheets"))).toBe("https://orrea.lovable.app/api/public/google-oauth/callback");
  });
  it("ignores spoofed forwarding on a production request", () => {
    expect(googleCallbackUrl(new Request("https://orrea.vercel.app/admin/sheets", { headers: { "x-forwarded-host": "attacker.example" } }), { VERCEL: "1" })).toBe("https://orrea.vercel.app/api/public/google-oauth/callback");
  });
  it("supports an explicitly configured Vercel custom domain", () => {
    expect(googleCallbackUrl(new Request("http://localhost/admin/sheets"), { VERCEL: "1", GOOGLE_OAUTH_ORIGIN: "https://shop.example" })).toBe("https://shop.example/api/public/google-oauth/callback");
  });
  it("does not change Lovable when Vercel configuration exists", () => {
    expect(googleCallbackUrl(new Request("https://orrea.lovable.app/admin/sheets"), { GOOGLE_OAUTH_ORIGIN: "https://shop.example" })).toBe("https://orrea.lovable.app/api/public/google-oauth/callback");
  });
  it("rejects insecure or path-containing configured origins", () => {
    for (const origin of ["http://shop.example", "https://shop.example/admin", "https://user:password@shop.example", "https://shop.example?redirect=other"]) {
      expect(() => googleCallbackUrl(new Request("https://orrea.vercel.app"), { VERCEL: "1", GOOGLE_OAUTH_ORIGIN: origin })).toThrow();
    }
  });
});