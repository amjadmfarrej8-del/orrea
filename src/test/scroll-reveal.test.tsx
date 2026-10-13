import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "@/components/site/ScrollReveal";

vi.mock("@tanstack/react-router", () => ({ useRouterState: () => "/shop" }));

let notify: IntersectionObserverCallback;
const observe = vi.fn();
const cancel = vi.fn();
const animate = vi.fn(() => ({ cancel, onfinish: null }));
const rect = (top = 0): DOMRect => ({ x: 0, y: top, top, bottom: top + 40, left: 0, right: 100, width: 100, height: 40, toJSON: () => ({}) });

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect(100));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { notify = callback; }
    observe = observe;
    unobserve = vi.fn();
    disconnect = vi.fn();
  });
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

function intersect(target: HTMLElement, visible: boolean, top = 0) {
  notify([{ target, isIntersecting: visible, boundingClientRect: rect(top), intersectionRatio: visible ? 1 : 0, intersectionRect: rect(), rootBounds: null, time: 0 }], {} as IntersectionObserver);
}

describe("Storefront scroll motion", () => {
  it("uses a 600ms fade with 30px upward travel", () => {
    const { getByText } = render(<><main><h2>Test</h2></main><ScrollReveal /></>);
    intersect(getByText("Test"), true);
    expect(animate).toHaveBeenCalledWith(
      [{ opacity: 0, translate: "0 30px" }, { opacity: 1, translate: "0 0" }],
      expect.objectContaining({ duration: 600 }),
    );
  });

  it("replays when returning from below the viewport, not when leaving upwards", () => {
    const { getByText } = render(<><main><h2>Test</h2></main><ScrollReveal /></>);
    const target = getByText("Test");
    intersect(target, true);
    intersect(target, false, -100);
    intersect(target, true);
    expect(animate).toHaveBeenCalledTimes(1);
    intersect(target, false, 2000);
    intersect(target, true);
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it("skips animation when reduced motion is requested", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    render(<><main><h2>Test</h2></main><ScrollReveal /></>);
    expect(observe).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});