import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { defaultSettings } from "@/lib/settings";

describe("Fashion store defaults", () => {
  it("preserves the 35 MAD shipping fee and 500 MAD free threshold", () => {
    expect(defaultSettings.store.shipping_fee).toBe(35);
    expect(defaultSettings.store.free_shipping_threshold).toBe(500);
  });
  it("keeps the Nouveautés section disabled", () => {
    expect(defaultSettings.homepage.sections.find((section) => section.type === "new")?.visible).toBe(false);
  });
});