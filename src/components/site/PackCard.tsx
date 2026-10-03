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
  return (
    <section className={`mx-auto max-w-[1600px] px-5 md:px-10 lg:px-12 xl:px-16 ${className}`}>
      <div className={`mx-auto grid gap-8 lg:gap-10 ${packs.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : packs.length === 2 ? "max-w-5xl md:grid-cols-2" : "max-w-md"}`}>
        {packs.map((p) => {
          const out = p.stock === 0;
          return (
            <article key={p.id} className="flex h-full flex-col border border-border/60 bg-card">
              <Link to="/products/$slug" params={{ slug: p.slug }} className="block bg-background/60 p-6 lg:p-8">
                <img src={productImage(p.image)} alt={ar ? p.name_ar : p.name_fr} loading="lazy" width={1104} height={1104} className="aspect-square w-full object-contain" />
              </Link>
              <div className="flex flex-1 flex-col items-center border-t border-border/60 px-6 py-9 text-center lg:px-8 lg:py-10">
                <p className="eyebrow text-champagne">{p.badge && p.badge !== "Pack" ? (ar && p.badge === "Offre exclusive" ? "عرض حصري" : p.badge) : L("Offre exclusive", "عرض حصري")}</p>
                <h3 className="mt-4 text-2xl leading-tight md:text-3xl">{ar ? p.name_ar : p.name_fr}</h3>
                {(ar ? p.tagline_ar : p.tagline_fr) && <p className="mt-4 text-[0.8rem] tracking-[0.12em] uppercase text-muted-foreground">{ar ? p.tagline_ar : p.tagline_fr}</p>}
                <div className="mt-auto pt-7">
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-2xl font-semibold">{formatMAD(Number(p.price), lang)}</span>
                    {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                      <span className="text-sm text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</span>
                    )}
                  </div>
                  {p.free_shipping && <p className="mt-2 text-[0.76rem] tracking-[0.12em] uppercase text-muted-foreground">{L("Livraison gratuite", "توصيل مجاني")}</p>}
                  <button onClick={() => buy(p)} disabled={out} className="btn-lux mt-7">
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
