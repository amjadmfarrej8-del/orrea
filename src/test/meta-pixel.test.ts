import { describe, expect, it } from "vitest";
import { canEnableMetaPixel, pixelIdSchema } from "@/lib/meta-pixel";

describe("Meta Pixel configuration safety", () => {
  it("accepts a numeric ID without interpreting it as authorization", () => {
    expect(pixelIdSchema.parse(" 123456789012345 ")).toBe("123456789012345");
    expect(canEnableMetaPixel("123456789012345")).toBe(false);
  });
  it("rejects pasted scripts and credentials instead of storing them", () => {
    expect(pixelIdSchema.safeParse("<script>fbq()</script>").success).toBe(false);
    expect(pixelIdSchema.safeParse("EAAB-not-a-pixel-id").success).toBe(false);
  });
  it("permits clearing configuration but never activating an empty ID", () => {
    expect(pixelIdSchema.parse("")).toBe("");
    expect(canEnableMetaPixel("")).toBe(false);
  });
});