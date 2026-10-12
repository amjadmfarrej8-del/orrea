import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const candidates = "[data-reveal-item], .card-lux, a.group, figure, picture, h1, h2, h3, h4, p, img, .btn-lux, .btn-ghost-lux, button";

/** Enhances existing storefront nodes without adding layout wrappers. */
export function ScrollReveal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/admin") || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scopes = Array.from(document.querySelectorAll<HTMLElement>("main, footer"));
    const tracked = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    let frame = 0;

    const show = (element: HTMLElement, delay = 0) => {
      if (element.dataset['scrollReveal'] === "visible") return;
      animations.get(element)?.cancel();
      element.dataset['scrollReveal'] = "visible";
      if (motion.matches) return;
      const animation = element.animate(
        [{ opacity: 0, translate: "0 30px" }, { opacity: 1, translate: "0 0" }],
        { duration: 600, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
      );
      animations.set(element, animation);
      animation.onfinish = () => animations.delete(element);
    };

    const observer = new IntersectionObserver((entries) => {
      let order = 0;
      for (const entry of entries) {
        const element = entry.target;
        if (!(element instanceof HTMLElement)) continue;
        if (entry.isIntersecting) {
          show(element, Math.min(order++, 3) * 70);
        } else if (entry.boundingClientRect.top >= window.innerHeight - 24 && !element.contains(document.activeElement)) {
          // Only re-arm below the viewport: content stays visible while scrolling upwards.
          animations.get(element)?.cancel();
          animations.delete(element);
          element.dataset['scrollReveal'] = "pending";
        }
      }
    }, { rootMargin: "0px 0px -24px 0px", threshold: 0 });

    const discover = () => {
      frame = 0;
      for (const element of tracked) {
        if (!element.isConnected) {
          observer.unobserve(element);
          animations.get(element)?.cancel();
          animations.delete(element);
          tracked.delete(element);
        }
      }
      if (motion.matches) return;
      for (const scope of scopes) {
        scope.dataset['scrollRevealScope'] = "";
        for (const element of scope.querySelectorAll<HTMLElement>(candidates)) {
          if (tracked.has(element) || element.parentElement?.closest(candidates) || element.closest('[role="dialog"], [aria-hidden="true"], [data-reveal-skip]')) continue;
          tracked.add(element);
          // Already-passed content must never disappear after navigation or a data update.
          element.dataset['scrollReveal'] = element.getBoundingClientRect().bottom <= 0 ? "visible" : "pending";
          observer.observe(element);
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(discover); };
    const mutations = new MutationObserver(schedule);
    for (const scope of scopes) mutations.observe(scope, { childList: true, subtree: true });
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-scroll-reveal]");
      if (element) {
        show(element);
        animations.get(element)?.cancel();
        animations.delete(element);
      }
    };
    const preferenceChanged = () => {
      if (motion.matches) {
        for (const element of tracked) show(element);
        for (const animation of animations.values()) animation.cancel();
        animations.clear();
      } else discover();
    };
    document.addEventListener("focusin", focus);
    motion.addEventListener("change", preferenceChanged);
    discover();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("focusin", focus);
      motion.removeEventListener("change", preferenceChanged);
      for (const animation of animations.values()) animation.cancel();
      for (const element of tracked) delete element.dataset['scrollReveal'];
      for (const scope of scopes) delete scope.dataset['scrollRevealScope'];
    };
  }, [pathname]);

  return null;
}