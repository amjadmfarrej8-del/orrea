import { Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productImage, productsQuery, type Product } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export const isPack = (p: Pick<Product, "bundle_items">) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0;

/** Featured bundle offer. Shows the first active bundle product; renders nothing if none. */
export function PackCard({ className = "" }: { className?: string }) {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { lang, L } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const p = products.find(isPack);
  if (!p) return null;
  const ar = lang === "ar";
  const out = p.stock === 0;
  const buy = () => {
    add({ id: p.id, slug: p.slug, name_fr: p.name_fr, name_ar: p.name_ar, price: Number(p.price), image: p.image, stock: p.stock, free_shipping: p.free_shipping }, 1);
    navigate({ to: "/cart" });
  };
  return (
    <section className={`mx-auto max-w-[1600px] px-5 md:px-10 lg:px-12 xl:px-16 ${className}`}>
      <div className="grid overflow-hidden bg-card md:grid-cols-2">
        <Link to="/products/$slug" params={{ slug: p.slug }} className="relative block">
          <img src={productImage(p.image)} alt={ar ? p.name_ar : p.name_fr} loading="lazy" width={1104} height={1104} className="aspect-square h-full w-full object-cover" />
          <div className="absolute start-4 top-4 bg-foreground px-4 py-3 text-center text-background">
            <div className="text-[0.6rem] tracking-[0.3em] uppercase">Pack</div>
            <div className="mt-1 text-xl" style={{ fontFamily: "var(--font-display)" }}>{formatMAD(Number(p.price), lang)}</div>
            <div className="mt-1 text-[0.55rem] tracking-[0.2em] uppercase">{L("Livraison gratuite", "توصيل مجاني")}</div>
          </div>
        </Link>
        <div className="flex flex-col justify-center p-8 md:p-14 xl:p-20">
          <p className="eyebrow">{L("Offre exclusive", "عرض حصري")}</p>
          <h2 className="mt-5 text-4xl leading-tight md:text-5xl xl:text-6xl">
            {L("Pack Éclaircissant", "باك التفتيح")}
            <span className="mt-2 block text-2xl text-muted-foreground md:text-3xl">{L("Zones Sensibles", "المناطق الحساسة")}</span>
          </h2>
          <p className="mt-6 text-[0.72rem] tracking-[0.3em] uppercase">{L("Sérum + Crème", "سيروم + كريم")}</p>
          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>{formatMAD(Number(p.price), lang)}</span>
            {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
              <span className="text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</span>
            )}
          </div>
          <p className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground">{L("Livraison gratuite", "توصيل مجاني")}</p>
          <button onClick={buy} disabled={out} className="btn-lux mt-9 self-start">
            {out ? L("Épuisé", "نفد المخزون") : L("Acheter le pack", "اشتري الباك")}
          </button>
        </div>
      </div>
    </section>
  );
}
