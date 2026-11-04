import { describe, expect, it } from "vitest";
import { shippingFor } from "@/lib/cart";

describe("Store-wide free delivery", () => {
  it("charges 0 MAD delivery on every order, with no minimum", () => {
    expect(shippingFor(259)).toBe(0);
    expect(shippingFor(1)).toBe(0);
    expect(shippingFor(0)).toBe(0);
  });
});
