import { describe, expect, it } from "vitest";
import { shippingFor } from "@/lib/cart";

describe("Ensemble delivery pricing", () => {
  it("charges 20 MAD delivery for the 259 MAD outfit", () => {
    expect(shippingFor(259)).toBe(20);
    expect(259 + shippingFor(259)).toBe(279);
  });
  it("retains free delivery at the existing 500 MAD threshold", () => {
    expect(shippingFor(500)).toBe(0);
  });
});