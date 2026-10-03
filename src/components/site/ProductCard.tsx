import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { productImage, type Product } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export function ProductCard({ p }: { p: Product }) {
  const { lang, t } = useI18n();
  const { add } = useCart();
  const [done, setDone] = useState(false);
  return (
    <Link to="/products/$slug" params={{ slug: p.slug }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <img
          src={productImage(p.image)}
          alt={lang === "ar" ? p.name_ar : p.name_fr}
          loading="lazy"
          width={912}
          height={1104}
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
        {(p.stock === 0 || p.badge || p.is_new) && (
          <span className="absolute start-3 top-3 bg-background px-2 py-1 text-[0.8rem] tracking-[0.12em] uppercase">
            {p.stock === 0 ? t.outOfStock : p.badge || (lang === "ar" ? "جديد" : "Nouveau")}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl leading-tight md:text-[1.4rem]">{lang === "ar" ? p.name_ar : p.name_fr}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{lang === "ar" ? p.tagline_ar : p.tagline_fr}</p>
        </div>
        <div className="shrink-0 text-end text-base">
          <div className="font-semibold">{formatMAD(Number(p.price), lang)}</div>
          {p.compare_at_price && (
            <div className="text-xs text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</div>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={p.stock === 0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          add({ id: p.id, slug: p.slug, name_fr: p.name_fr, name_ar: p.name_ar, price: Number(p.price), image: p.image, stock: p.stock, free_shipping: p.free_shipping }, 1);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
        className="btn-ghost-lux mt-4 w-full !py-2.5 text-[0.76rem]"
      >
        {p.stock === 0 ? t.outOfStock : done ? t.added : t.addToCart}
      </button>
    </Link>
  );
}
