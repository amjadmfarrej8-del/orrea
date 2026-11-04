import { useEffect, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { ProductCard } from "@/components/site/ProductCard";
import { type Product } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

/** Intentionally used only by the Homme collection. */
export function HommeCollectionCarousel({ products }: { products: Product[] }) {
  const { L } = useI18n();
  const autoScroll = useMemo(() => AutoScroll({
    speed: 0.6,
    startDelay: 1200,
    playOnInit: false,
    stopOnInteraction: false,
  }), []);
  const [viewportRef, api] = useEmblaCarousel({
    loop: true, dragFree: true, align: "start", direction: "ltr",
  }, [autoScroll]);
  const region = useRef<HTMLDivElement>(null);
  // Enough real cards to cover the viewport even for a very small collection.
  const slides = products.length > 4 ? products : Array.from(
    { length: Math.ceil(8 / Math.max(products.length, 1)) }, () => products,
  ).flat();

  useEffect(() => {
    const element = region.current;
    if (!api || !element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hovered = false;
    let pressed = false;
    let focused = false;
    let visible = false;
    let interacting = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastWheel = 0;
    const sync = () => {
      if (motion.matches || document.hidden || !visible || hovered || pressed || focused || interacting) autoScroll.stop();
      else if (!autoScroll.isPlaying()) autoScroll.play();
    };
    const mouseEnter = () => { hovered = true; sync(); };
    const mouseLeave = () => { hovered = false; sync(); };
    const pointerDown = () => { pressed = true; sync(); };
    const settleInteraction = () => {
      interacting = true;
      autoScroll.stop();
      clearTimeout(timer);
      timer = setTimeout(() => { interacting = false; sync(); }, 1200);
    };
    const pointerUp = () => { if (!pressed) return; pressed = false; settleInteraction(); };
    const focusIn = () => { focused = true; sync(); };
    const focusOut = (event: FocusEvent) => {
      focused = event.relatedTarget instanceof Node && element.contains(event.relatedTarget);
      sync();
    };
    const wheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
      if (!delta) return; // Preserve normal vertical page scrolling.
      event.preventDefault();
      settleInteraction();
      if (performance.now() - lastWheel < 160) return;
      lastWheel = performance.now();
      if (delta > 0) api.scrollNext(); else api.scrollPrev();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      settleInteraction();
      if (event.key === "ArrowRight") api.scrollNext(); else api.scrollPrev();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; sync(); });
    observer.observe(element);
    element.addEventListener("mouseenter", mouseEnter);
    element.addEventListener("mouseleave", mouseLeave);
    element.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    element.addEventListener("focusin", focusIn);
    element.addEventListener("focusout", focusOut);
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("keydown", keyDown);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    api.on("settle", sync).on("reInit", sync);
    return () => {
      clearTimeout(timer);
      autoScroll.stop();
      observer.disconnect();
      element.removeEventListener("mouseenter", mouseEnter);
      element.removeEventListener("mouseleave", mouseLeave);
      element.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      element.removeEventListener("focusin", focusIn);
      element.removeEventListener("focusout", focusOut);
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("keydown", keyDown);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      api.off("settle", sync).off("reInit", sync);
    };
  }, [api, autoScroll]);

  return (
    <div ref={region} role="region" aria-roledescription="carousel" aria-label={L("Collection Homme", "مجموعة الرجال")} data-reveal-skip className="mt-12 min-w-0">
      <div ref={viewportRef} dir="ltr" className="cursor-grab overflow-hidden touch-pan-y active:cursor-grabbing">
        <div className="-ml-3 flex md:-ml-6">
          {slides.map((p, index) => (
            <div key={`${p.id}-${index}`} className="min-w-0 flex-[0_0_58%] pl-3 md:flex-[0_0_33.333%] md:pl-6 xl:flex-[0_0_25%]">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}