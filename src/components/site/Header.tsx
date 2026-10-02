import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="bg-primary py-2 text-center text-[0.65rem] tracking-[0.25em] uppercase text-primary-foreground">
        {t.freeShippingNote} · {t.cod}
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-5 py-5 md:px-10">
        <nav className="flex gap-6 text-[0.72rem] tracking-[0.2em] uppercase">
          <Link to="/shop" className="link-lux">{t.shop}</Link>
          <Link to="/about" className="link-lux hidden sm:inline">{t.about}</Link>
        </nav>
        <Link to="/" className="text-center font-display text-2xl tracking-[0.3em] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          THÉRAVÉN
        </Link>
        <div className="flex items-center justify-end gap-5 text-[0.72rem] tracking-[0.2em] uppercase">
          <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="link-lux" aria-label="Langue">
            {lang === "fr" ? "عربي" : "FR"}
          </button>
          <Link to="/cart" className="relative" aria-label={t.cart}>
            <ShoppingBag className="h-5 w-5" strokeWidth={1.2} />
            {count > 0 && (
              <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[0.6rem] text-primary">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
