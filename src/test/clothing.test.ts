import { describe, expect, it } from "vitest";
import { canOrderClothing, quickOrderSchema, productColorManagerSchema, readColors } from "@/lib/clothing";
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
describe("Individual color photos", () => {
  it("allows more than 30 color entries", () => {
    expect(productColorManagerSchema.safeParse(Array.from({ length: 100 }, (_, i) => ({ name: `Couleur ${i}`, image: `/image-${i}.jpg` }))).success).toBe(true);
  });
  it("requires each color's image and name", () => {
    expect(productColorManagerSchema.safeParse([{ name: "Beige", image: "" }]).success).toBe(false);
    expect(productColorManagerSchema.safeParse([{ name: "", image: "/beige.jpg" }]).success).toBe(false);
  });
  it("keeps free-form names paired with their own images", () => {
    const colors = [{ name: "Beige", image: "/beige.jpg" }, { name: "Noir", image: "/noir.jpg", hex: "#000000" }];
    expect(readColors(productColorManagerSchema.parse(colors))).toEqual(colors);
  });
  it("makes HEX optional and rejects malformed values", () => {
    expect(productColorManagerSchema.safeParse([{ name: "Gris", image: "/gris.jpg" }]).success).toBe(true);
    expect(productColorManagerSchema.safeParse([{ name: "Gris", image: "/gris.jpg", hex: "invalid" }]).success).toBe(false);
  });
  it("rejects duplicate names to avoid ambiguous image selection", () => {
    expect(productColorManagerSchema.safeParse([{ name: "Noir", image: "/a.jpg" }, { name: " noir ", image: "/b.jpg" }]).success).toBe(false);
  });
});