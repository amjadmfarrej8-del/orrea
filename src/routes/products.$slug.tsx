import { pageHead, breadcrumbLd, SITE_URL, SITE_NAME } from "@/lib/seo";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productImage, productQuery, productsQuery } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { canOrderClothing, readColors } from "@/lib/clothing";
import { QuickOrder } from "@/components/site/QuickOrder";
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
    const gallery = [p.image, ...(p.gallery ?? [])].map(productImage).filter((u) => u.startsWith("https://"));
    return {
      slug: p.slug, name: p.name_fr, tagline: p.tagline_fr, description: p.description_fr, sku: p.sku,
      image: img.startsWith("https://") ? img : "", images: [...new Set(gallery)],
      price: p.price_confirmed && p.price > 0 ? Number(p.price) : null, inStock: p.stock > 0,
    };
  },
  staticData: { sitemap: true },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produit introuvable | ORRÉA" }, { name: "robots", content: "noindex" }] };
    const d = loaderData;
    const path = `/products/${d.slug}`;
    const description = (d.description || d.tagline || `${d.name} — mode ORRÉA au Maroc. Livraison gratuite, paiement à la livraison.`).replace(/\s+/g, " ").trim();
    const head = pageHead({ path, title: `${d.name} | ORRÉA Maroc`, description, image: d.image || undefined, type: "product" });
    const product: Record<string, unknown> = {
      "@context": "https://schema.org", "@type": "Product", name: d.name, description, sku: d.sku || undefined,
      image: d.images.length ? d.images : undefined, brand: { "@type": "Brand", name: SITE_NAME }, url: `${SITE_URL}${path}`,
    };
    // Offer only when the price is confirmed by the store — never publish unconfirmed prices.
    if (d.price) product["offers"] = { "@type": "Offer", price: d.price.toFixed(2), priceCurrency: "MAD", url: `${SITE_URL}${path}`,
      availability: d.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" };
    return {
      ...head,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(product) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Boutique", path: "/shop" }, { name: d.name, path }])) },
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
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [tab, setTab] = useState<"description" | "benefits" | "ingredients" | "usage" | "warnings">("description");
  if (!p) return null;
  const ar = lang === "ar";
  const name = ar ? p.name_ar : p.name_fr;
  const colors = readColors(p.colors);
  const colorImage = colors.find(c => c.name === color)?.image;
  const images = [...new Set([colorImage || p.image, p.image, ...(p.gallery ?? [])].filter(Boolean))].map(productImage);
  const currentPhoto = photo % images.length;
  const content: Record<typeof tab, string> = {
    description: ar ? p.description_ar : p.description_fr,
    benefits: ar ? p.benefits_ar : p.benefits_fr,
    ingredients: ar ? p.ingredients_ar : p.ingredients_fr,
    usage: ar ? p.usage_ar : p.usage_fr,
    warnings: ar ? p.warnings_ar : p.warnings_fr,
  };
  const tabLabels: Record<typeof tab, string> = {
    description: t.description, benefits: L("Détails", "التفاصيل"), ingredients: t.ingredients, usage: t.usage, warnings: L("Précautions", "تحذيرات"),
  };
  const tabs = (Object.keys(content) as (typeof tab)[]).filter((k) => content[k]);
  const discount = p.compare_at_price && Number(p.compare_at_price) > Number(p.price) ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
  const singles = all.filter((x) => !isPack(x));
  const related = singles.filter((x) => x.id !== p.id && x.category_id === p.category_id).concat(singles.filter((x) => x.id !== p.id && x.category_id !== p.category_id)).slice(0, 4);

  const available = canOrderClothing(p, colors, size, color);
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)] lg:gap-10">
        <div className="min-w-0">
          <Button variant="ghost" aria-label={L("Agrandir la photo", "تكبير الصورة")} className="block h-auto w-full cursor-zoom-in rounded-none bg-studio p-0 hover:bg-studio" onClick={() => setZoom(images[currentPhoto] ?? null)}>
            <img src={images[currentPhoto]} alt={name} width={912} height={1104} fetchPriority="high" className="h-[82svh] min-h-[28rem] w-full object-contain object-center lg:h-[calc(100svh-88px)]" />
          </Button>
          {images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((src, i) => (
                <Button key={src} variant="ghost" aria-label={L(`Photo ${i + 1}`, `الصورة ${i + 1}`)} aria-current={i === currentPhoto} onClick={() => setPhoto(i)} className={`h-24 w-20 shrink-0 overflow-hidden rounded-none bg-studio p-0 hover:bg-studio ${i === currentPhoto ? "ring-1 ring-primary" : "opacity-60"}`}>
                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain object-center" />
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 lg:sticky lg:top-28 lg:self-start lg:pe-12 lg:pb-10">
          <p className="eyebrow">{p.size}{p.sku && ` · ${p.sku}`}</p>
          <h1 className="mt-4 font-sans text-[1.9rem] font-medium leading-tight md:text-[2.6rem]">{name}</h1>
          <p className="mt-3 text-muted-foreground">{ar ? p.tagline_ar : p.tagline_fr}</p>
          <div className="mt-8 flex items-baseline gap-4 text-2xl">
            {p.price_confirmed ? formatMAD(Number(p.price), lang) : L("Prix à confirmer", "السعر قيد التأكيد")}
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

          {colors.length > 0 && <fieldset className="mt-7"><legend className="text-sm">{L("Couleur", "اللون")}{color && ` · ${color}`}</legend><div className="mt-3 flex flex-wrap gap-3">{colors.map(c => <Button key={c.name} variant="outline" aria-label={c.name} aria-pressed={color === c.name} onClick={() => { setColor(c.name); setPhoto(0); }} className={`h-20 w-16 overflow-hidden rounded-none p-0 ${color === c.name ? "border-primary ring-1 ring-primary" : "border-border"}`}><img src={productImage(c.image || p.image)} alt={c.name} loading="lazy" decoding="async" className="h-full w-full bg-studio object-contain object-center" /></Button>)}</div></fieldset>}
          <fieldset className="mt-6"><legend className="text-sm">{L("Taille", "المقاس")}</legend>{p.sizes.length ? <div className="mt-3 flex flex-wrap gap-2">{p.sizes.map(value => <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)} className={`h-11 min-w-14 rounded-[10px] border border-cta px-4 text-sm uppercase tracking-wide transition-all duration-200 ${size === value ? "bg-cta font-medium text-street-black" : "bg-street-black text-foreground hover:bg-cta/15"}`}>{value}</button>)}</div> : <p className="mt-2 text-xs text-muted-foreground">{L("Tailles à confirmer", "المقاسات قيد التأكيد")}</p>}</fieldset>
          <QuickOrder key={p.id} productId={p.id} price={p.price_confirmed ? Number(p.price) : 0} freeShipping={p.free_shipping} size={size} color={color} disabled={!available} />
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
        <div role="dialog" aria-modal="true" aria-label={name} className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4">
          <Button variant="ghost" size="icon" aria-label={L("Fermer", "إغلاق")} className="absolute end-4 top-4" onClick={() => setZoom(null)}><X /></Button>
          <img src={zoom} alt={name} className="max-h-full max-w-full bg-studio object-contain" />
        </div>
      )}
    </>
  );
}
