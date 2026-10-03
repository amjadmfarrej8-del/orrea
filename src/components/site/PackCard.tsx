import { Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productImage, productsQuery, type Product } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export const isPack = (p: Pick<Product, "bundle_items">) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0;

/** Featured bundle offers, optionally limited to packs containing selected products. */
export function PackCard({ className = "", productIds, excludeIds = [] }: { className?: string; productIds?: string[]; excludeIds?: string[] }) {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { lang, L } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const packs = products.filter((product) => {
    if (!isPack(product) || excludeIds.includes(product.id)) return false;
    if (!productIds?.length) return true;
    return (product.bundle_items as { product_id: string }[]).some((item) => productIds.includes(item.product_id));
  });
  if (!packs.length) return null;
  const ar = lang === "ar";
  const buy = (p: Product) => {
    add({ id: p.id, slug: p.slug, name_fr: p.name_fr, name_ar: p.name_ar, price: Number(p.price), image: p.image, stock: p.stock, free_shipping: p.free_shipping }, 1);
    navigate({ to: "/cart" });
  };
  return (
    <section className={`mx-auto max-w-[1600px] px-5 md:px-10 lg:px-12 xl:px-16 ${className}`}>
      <div className={`grid gap-8 ${packs.length > 1 ? "xl:grid-cols-2" : ""}`}>
        {packs.map((p) => {
          const out = p.stock === 0;
          return (
            <article key={p.id} className="grid overflow-hidden bg-card md:grid-cols-2">
              <Link to="/products/$slug" params={{ slug: p.slug }} className="relative block">
                <img src={productImage(p.image)} alt={ar ? p.name_ar : p.name_fr} loading="lazy" width={1104} height={1104} className="aspect-square h-full w-full object-cover" />
                <div className="absolute start-4 top-4 bg-foreground px-4 py-3 text-center text-background">
                  <div className="text-[0.6rem] tracking-[0.3em] uppercase">Pack</div>
                  <div className="mt-1 text-xl" style={{ fontFamily: "var(--font-display)" }}>{formatMAD(Number(p.price), lang)}</div>
                  <div className="mt-1 text-[0.55rem] tracking-[0.2em] uppercase">{L("Livraison gratuite", "توصيل مجاني")}</div>
                </div>
              </Link>
              <div className="flex flex-col justify-center p-8 md:p-10 xl:p-12">
                <p className="eyebrow">{L("Offre exclusive", "عرض حصري")}</p>
                <h2 className="mt-5 text-3xl leading-tight md:text-4xl xl:text-5xl">{ar ? p.name_ar : p.name_fr}</h2>
                {(ar ? p.tagline_ar : p.tagline_fr) && <p className="mt-5 text-[0.72rem] tracking-[0.2em] uppercase text-muted-foreground">{ar ? p.tagline_ar : p.tagline_fr}</p>}
                <div className="mt-6 flex items-baseline gap-4">
                  <span className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>{formatMAD(Number(p.price), lang)}</span>
                  {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                    <span className="text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</span>
                  )}
                </div>
                <p className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground">{L("Livraison gratuite", "توصيل مجاني")}</p>
                <button onClick={() => buy(p)} disabled={out} className="btn-lux mt-9 self-start">
                  {out ? L("Épuisé", "نفد المخزون") : L("Acheter le pack", "اشتري الباك")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
