import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { productImage, productQuery, productsQuery } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { settingsQuery, waLink } from "@/lib/settings";
import { ProductCard } from "@/components/site/ProductCard";
import { PackCard, isPack } from "@/components/site/PackCard";
import { Reassurance } from "@/components/site/Reassurance";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery);
    const img = productImage(p.image);
    return { name: p.name_fr, tagline: p.tagline_fr, description: p.description_fr, image: img.startsWith("https://") ? img : "" };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produit introuvable — THÉRAVÈNE" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.name} — THÉRAVÈNE` },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} — THÉRAVÈNE` },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "product" },
        ...(loaderData.image ? [{ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="text-[2rem] leading-tight md:text-[2.9rem]">Produit introuvable</h1>
      <Link to="/shop" className="btn-lux mt-8">Boutique</Link>
    </div>
  ),
  errorComponent: () => <div className="px-5 py-32 text-center">Erreur de chargement.</div>,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(productsQuery);
  const { data: s } = useQuery(settingsQuery);
  const { t, lang, L } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);
  const [tab, setTab] = useState<"description" | "benefits" | "ingredients" | "usage" | "warnings">("description");
  if (!p) return null;
  const ar = lang === "ar";
  const name = ar ? p.name_ar : p.name_fr;
  const images = [p.image, ...(p.gallery ?? [])].filter(Boolean).map(productImage);
  const content: Record<typeof tab, string> = {
    description: ar ? p.description_ar : p.description_fr,
    benefits: ar ? p.benefits_ar : p.benefits_fr,
    ingredients: ar ? p.ingredients_ar : p.ingredients_fr,
    usage: ar ? p.usage_ar : p.usage_fr,
    warnings: ar ? p.warnings_ar : p.warnings_fr,
  };
  const tabLabels: Record<typeof tab, string> = {
    description: t.description, benefits: L("Bienfaits", "الفوائد"), ingredients: t.ingredients, usage: t.usage, warnings: L("Précautions", "تحذيرات"),
  };
  const tabs = (Object.keys(content) as (typeof tab)[]).filter((k) => content[k]);
  const discount = p.compare_at_price && Number(p.compare_at_price) > Number(p.price) ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
  const singles = all.filter((x) => !isPack(x));
  const related = singles.filter((x) => x.id !== p.id && x.category_id === p.category_id).concat(singles.filter((x) => x.id !== p.id && x.category_id !== p.category_id)).slice(0, 4);

  const item = { id: p.id, slug: p.slug, name_fr: p.name_fr, name_ar: p.name_ar, price: Number(p.price), image: p.image, stock: p.stock, free_shipping: p.free_shipping };
  const onAdd = () => {
    add(item, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const buyNow = () => {
    add(item, qty);
    navigate({ to: "/checkout" });
  };
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <nav className="mx-auto max-w-7xl px-5 pt-6 font-sans text-[0.7rem] tracking-[0.12em] text-muted-foreground uppercase md:px-10">
        <Link to="/" className="hover:text-foreground">{L("Accueil", "الرئيسية")}</Link> / <Link to={isPack(p) ? "/offres" : "/shop"} className="hover:text-foreground">{isPack(p) ? L("Offres", "العروض") : t.shop}</Link> / <span className="text-foreground">{name}</span>
      </nav>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-6 md:grid-cols-2 md:gap-20 md:px-10 md:pt-16">
        <div>
          <button className="block w-full cursor-zoom-in bg-card" onClick={() => setZoom(images[img] ?? null)}>
            <img src={images[img]} alt={name} width={912} height={1104} className="aspect-square w-full object-contain" />
          </button>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImg(i)} className={`h-20 w-16 overflow-hidden border ${i === img ? "border-foreground" : "border-transparent"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="md:sticky md:top-32 md:self-start">
          <p className="eyebrow">{p.size}{p.sku && ` · ${p.sku}`}</p>
          <h1 className="mt-4 text-[1.9rem] leading-tight md:text-[2.6rem]">{name}</h1>
          <p className="mt-3 text-muted-foreground">{ar ? p.tagline_ar : p.tagline_fr}</p>
          <div className="mt-8 flex items-baseline gap-4 text-2xl">
            {formatMAD(Number(p.price), lang)}
            {discount > 0 && (
              <>
                <span className="text-base text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</span>
                <span className="bg-champagne/30 px-2 py-0.5 text-xs">−{discount}%</span>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {p.stock === 0 ? t.outOfStock : p.stock <= p.low_stock_threshold ? L(`Plus que ${p.stock} en stock`, `تبقى ${p.stock} فقط`) : L("En stock", "متوفر")}
          </p>

          <div className="mt-8 flex gap-4">
            <div className="flex items-center border border-border">
              <button className="p-4" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-"><Minus className="h-3 w-3" /></button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button className="p-4" onClick={() => setQty(Math.min(p.stock, 20, qty + 1))} aria-label="+"><Plus className="h-3 w-3" /></button>
            </div>
            <button className="btn-lux flex-1" disabled={p.stock === 0} onClick={onAdd}>
              {p.stock === 0 ? t.outOfStock : added ? t.added : t.addToCart}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="btn-ghost-lux" disabled={p.stock === 0} onClick={buyNow}>{L("Acheter", "اشتري الآن")}</button>
            {s?.store.whatsapp && (
              <a className="btn-ghost-lux" target="_blank" rel="noreferrer"
                href={waLink(s.store.whatsapp, L(`Bonjour, je souhaite commander : ${p.name_fr} × ${qty} (${p.price} MAD). ${url}`, `مرحباً، أرغب في طلب: ${p.name_ar} × ${qty} (${p.price} درهم). ${url}`))}>
                {L("Commander via WhatsApp", "اطلبي عبر واتساب")}
              </a>
            )}
          </div>
          {s?.store.whatsapp && (
            <a className="link-lux mt-4 inline-block text-xs text-muted-foreground" target="_blank" rel="noreferrer"
              href={waLink(s.store.whatsapp, L(`Bonjour, j'ai une question sur ${p.name_fr}.`, `مرحباً، لدي سؤال عن ${p.name_ar}.`))}>
              {L("Une question sur ce produit ?", "سؤال عن هذا المنتج؟")}
            </a>
          )}

          <div className="mt-8 border border-border"><Reassurance compact /></div>
          <div className="mt-12 border-t border-border">
            <div className="flex flex-wrap gap-x-7 gap-y-3 pt-6">
              {tabs.map((k) => (
                <button key={k} onClick={() => setTab(k)} className={`text-[0.8rem] tracking-[0.12em] uppercase ${tab === k ? "text-foreground" : "text-muted-foreground"}`}>
                  {tabLabels[k]}
                </button>
              ))}
            </div>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{content[tab]}</p>
          </div>
        </div>
      </div>

      <PackCard className="pt-24" productIds={[p.id]} excludeIds={[p.id]} />
      {isPack(p) && (
        <section className="mx-auto max-w-7xl px-5 pt-24 md:px-10">
          <h2 className="text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{L("Contenu du pack", "محتوى الباك")}</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8">
            {all.filter((x) => (p.bundle_items as { product_id: string }[]).some((b) => b.product_id === x.id)).map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pt-28 md:px-10">
          <h2 className="text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{L("Vous aimerez aussi", "قد يعجبك أيضاً")}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}

      {zoom && (
        <button className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-background/95 p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt={name} className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </>
  );
}
