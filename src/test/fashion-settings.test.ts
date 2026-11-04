import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { defaultSettings } from "@/lib/settings";

describe("Fashion store defaults", () => {
  it("ships free on all products, with no minimum order", () => {
    expect(defaultSettings.store.shipping_fee).toBe(0);
    expect(defaultSettings.store.free_shipping_threshold).toBe(0);
  });
  it("keeps cash on delivery as the only payment method", () => {
    expect(defaultSettings.store.whatsapp).toBeDefined();
  });
  it("shows the newly requested collection", () => {
    expect(defaultSettings.homepage.sections.find((section) => section.type === "new")?.visible).toBe(true);
  });
});
