import { Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productImage, productsQuery, type Product } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export const isPack = (p: Pick<Product, "bundle_items">) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0;

/** Featured bundle offers, optionally limited to packs containing selected products. */
export function PackCard({ className = "", productIds, excludeIds = [] }: { className?: string; productIds?: string[] | undefined; excludeIds?: string[] }) {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { lang, L } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const packs = products.filter((product) => {
    if (!isPack(product) || excludeIds.includes(product.id)) return false;
    if (!productIds?.length) return true;
    return (product.bundle_items as { product_id: string }[]).some((item) => productIds.includes(item.product_id));
  }).sort((a, b) => a.pack_sort_order - b.pack_sort_order);
  if (!packs.length) return null;
  const ar = lang === "ar";
  const buy = (p: Product) => {
    add({ id: p.id, slug: p.slug, name_fr: p.name_fr, name_ar: p.name_ar, price: Number(p.price), image: p.image, stock: p.stock, free_shipping: p.free_shipping }, 1);
    navigate({ to: "/cart" });
  };
  const grid =
    packs.length >= 3
      ? "grid-cols-2 gap-3 md:grid-cols-3 md:gap-8 lg:gap-10"
      : packs.length === 2
        ? "max-w-5xl grid-cols-2 gap-3 md:gap-8"
        : "max-w-md";
  return (
    <section className={`mx-auto max-w-[1600px] px-5 md:px-10 lg:px-12 xl:px-16 ${className}`}>
      <div className={`mx-auto grid ${grid}`}>
        {packs.map((p, i) => {
          const out = p.stock === 0;
          return (
            <article key={p.id} className={`flex h-full min-w-0 flex-col border border-border/60 bg-card ${i === 2 && packs.length >= 3 ? "col-span-2 w-[calc(50%-0.375rem)] justify-self-center md:col-span-1 md:w-auto" : ""}`}>
              <Link to="/products/$slug" params={{ slug: p.slug }} className="block bg-transparent p-0 md:bg-background/60 md:p-6 lg:p-8">
                <img src={productImage(p.image)} alt={ar ? p.name_ar : p.name_fr} loading="lazy" width={1104} height={1104} className="aspect-square w-full object-contain" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col items-center border-t border-border/60 px-3 py-4 text-center md:px-6 md:py-9 lg:px-8 lg:py-10">
                <p className="eyebrow text-champagne text-[0.58rem]! tracking-[0.08em]! md:text-[0.78rem]! md:tracking-[0.14em]!">{p.badge && p.badge !== "Pack" ? (ar && p.badge === "Offre exclusive" ? "عرض حصري" : p.badge) : L("Offre exclusive", "عرض حصري")}</p>
                <h3 className="mt-2 min-w-0 text-[0.95rem] leading-snug md:mt-4 md:text-2xl md:leading-tight lg:text-3xl">{ar ? p.name_ar : p.name_fr}</h3>
                {(ar ? p.tagline_ar : p.tagline_fr) && <p className="mt-1.5 min-w-0 text-[0.6rem] tracking-[0.04em] uppercase text-muted-foreground md:mt-4 md:text-[0.8rem] md:tracking-[0.12em]">{ar ? p.tagline_ar : p.tagline_fr}</p>}
                <div className="mt-auto w-full pt-3 md:pt-7">
                  <div className="flex items-baseline justify-center gap-2 md:gap-3">
                    <span className="text-lg font-semibold md:text-2xl">{formatMAD(Number(p.price), lang)}</span>
                    {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                      <span className="text-[0.66rem] text-muted-foreground line-through md:text-sm">{formatMAD(Number(p.compare_at_price), lang)}</span>
                    )}
                  </div>
                  {p.free_shipping && <p className="mt-1 text-[0.56rem] tracking-[0.08em] uppercase text-muted-foreground md:mt-2 md:text-[0.76rem] md:tracking-[0.12em]">{L("Livraison gratuite", "توصيل مجاني")}</p>}
                  <button onClick={() => buy(p)} disabled={out} className="btn-lux mt-3 w-full px-2! py-2.5! text-[0.62rem]! tracking-[0.06em]! md:mt-7 md:w-auto md:px-8! md:py-3.5! md:text-[0.82rem]! md:tracking-[0.1em]!">
                    {out ? L("Épuisé", "نفد المخزون") : L("Acheter le pack", "اشتري الباك")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
