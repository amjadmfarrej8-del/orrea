import { describe, expect, it } from "vitest";
import { canOrderClothing, quickOrderSchema } from "@/lib/clothing";
describe("Direct clothing orders", () => {
  it("accepts exactly the three requested contact fields", () => {
    expect(quickOrderSchema.parse({ name: "Amjad Test", phone: "0612345678", address: "Casablanca, rue Test 12", email: "ignored" })).toEqual({ name: "Amjad Test", phone: "0612345678", address: "Casablanca, rue Test 12" });
  });
  it("rejects invalid phone numbers", () => expect(quickOrderSchema.safeParse({ name: "Test", phone: "abc", address: "Rue Test 12" }).success).toBe(false));
  it("never sells an unconfirmed price", () => expect(canOrderClothing({ price: 259, price_confirmed: false, stock: 5, sizes: ["M"] }, [{ name: "Noir" }], "M", "Noir")).toBe(false));
  it("requires an actual listed size and color", () => {
    const p = { price: 259, price_confirmed: true, stock: 5, sizes: ["M"] };
    expect(canOrderClothing(p, [{ name: "Noir" }], "L", "Noir")).toBe(false);
    expect(canOrderClothing(p, [{ name: "Noir" }], "M", "Blanc")).toBe(false);
    expect(canOrderClothing(p, [{ name: "Noir" }], "M", "Noir")).toBe(true);
  });
});