import { describe, expect, it } from "vitest";
import { GOOGLE_POPUP_TIMEOUT_MS, requireSavedRow, syncActivation } from "@/lib/sheets-state";

describe("existing Google Sheets configuration", () => {
  it("rejects a write affecting no configuration row", () => {
    expect(() => requireSavedRow({ data: null, error: null }, "Save")).toThrow("aucune configuration");
  });
  it("does not report database write failures as success", () => {
    expect(() => requireSavedRow({ data: null, error: { message: "permission denied" } }, "Save")).toThrow("permission denied");
  });
  it("accepts a confirmed persisted singleton", () => {
    expect(() => requireSavedRow({ data: { id: 1 }, error: null }, "Save")).not.toThrow();
  });
  it("keeps pending orders eligible when synchronization is resumed", () => {
    expect(syncActivation(true, "2026-11-01T10:00:00Z", "2026-11-07T15:00:00Z").enabled_at).toBe("2026-11-01T10:00:00Z");
  });
  it("starts the initial activation window once", () => {
    expect(syncActivation(true, null, "2026-11-07T15:00:00Z").enabled_at).toBe("2026-11-07T15:00:00Z");
  });
  it("bounds the popup wait to the server state lifetime", () => {
    expect(GOOGLE_POPUP_TIMEOUT_MS).toBe(600000);
  });
});