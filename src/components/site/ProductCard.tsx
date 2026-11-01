import { Link } from "@tanstack/react-router";
import { productImage, type Product } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";

export function ProductCard({ p }: { p: Product }) {
  const { lang, t, L } = useI18n();
  return (
    <Link to="/products/$slug" params={{ slug: p.slug }} className="group flex h-full flex-col text-start">
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-studio">
        <img
          src={productImage(p.image)}
          alt={lang === "ar" ? p.name_ar : p.name_fr}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
        {(p.stock === 0 || p.badge) && (
          <span className="absolute start-2 top-2 bg-background px-2 py-1 text-[0.65rem] tracking-[0.14em] uppercase md:start-3 md:top-3 md:text-[0.72rem]">
            {p.stock === 0 ? t.outOfStock : p.badge}
          </span>
        )}
      </div>
      {(() => {
        const cat = (p as unknown as { categories?: { name_fr?: string; name_ar?: string } | null }).categories;
        const label = cat ? (lang === "ar" ? cat.name_ar : cat.name_fr) : "";
        return (
          <p className="mt-4 line-clamp-1 min-h-[1rem] px-2 font-sans text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase md:mt-5 md:px-4 md:text-[0.68rem] md:tracking-[0.22em]">
            {label}
          </p>
        );
      })()}
      <div className="mt-2 flex min-h-[2.8rem] items-start justify-center px-2 md:min-h-[3.4rem] md:px-4">
        <h3 className="line-clamp-2 text-[1rem] leading-snug md:text-[1.18rem]">{lang === "ar" ? p.name_ar : p.name_fr}</h3>
      </div>
      <div className="mt-2 flex items-baseline justify-center gap-2 px-2 font-sans text-sm md:text-base">
        <span className="font-medium">{p.price_confirmed ? formatMAD(Number(p.price), lang) : L("Prix à confirmer", "السعر قيد التأكيد")}</span>
        {p.compare_at_price && (
          <span className="text-xs text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</span>
        )}
      </div>
      <div className="mt-auto px-3 pb-4 pt-4 md:px-5 md:pb-6">
      <span className="flex min-h-11 w-full items-center justify-center border border-border text-xs uppercase transition-colors group-hover:border-primary group-hover:text-primary">{L("Voir l’article", "عرض المنتج")}</span>
      </div>
    </Link>
  );
}
