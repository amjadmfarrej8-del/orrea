import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { productImage, productQuery } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { name: p.name_fr, tagline: p.tagline_fr, description: p.description_fr };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produit introuvable — THÉRAVÉN" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.name} — THÉRAVÉN` },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} — THÉRAVÉN` },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "product" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="text-4xl">Produit introuvable</h1>
      <Link to="/shop" className="btn-lux mt-8">Boutique</Link>
    </div>
  ),
  errorComponent: () => <div className="px-5 py-32 text-center">Erreur de chargement.</div>,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { t, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"description" | "ingredients" | "usage">("description");
  if (!p) return null;
  const ar = lang === "ar";
  const content = { description: ar ? p.description_ar : p.description_fr, ingredients: ar ? p.ingredients_ar : p.ingredients_fr, usage: ar ? p.usage_ar : p.usage_fr };

  const onAdd = () => {
    add({ id: p.id, slug: p.slug, name_fr: p.name_fr, name_ar: p.name_ar, price: Number(p.price), image: p.image, stock: p.stock }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-10 md:grid-cols-2 md:gap-20 md:px-10 md:pt-16">
      <div className="bg-card">
        <img src={productImage(p.image)} alt={ar ? p.name_ar : p.name_fr} width={912} height={1104} className="aspect-[4/5] w-full object-cover" />
      </div>
      <div className="md:sticky md:top-32 md:self-start">
        <p className="eyebrow">{p.size}</p>
        <h1 className="mt-4 text-5xl leading-tight md:text-6xl">{ar ? p.name_ar : p.name_fr}</h1>
        <p className="mt-3 text-muted-foreground">{ar ? p.tagline_ar : p.tagline_fr}</p>
        <div className="mt-8 flex items-baseline gap-4 text-2xl">
          {formatMAD(Number(p.price), lang)}
          {p.compare_at_price && <span className="text-base text-muted-foreground line-through">{formatMAD(Number(p.compare_at_price), lang)}</span>}
        </div>

        <div className="mt-10 flex gap-4">
          <div className="flex items-center border border-border">
            <button className="p-4" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-"><Minus className="h-3 w-3" /></button>
            <span className="w-8 text-center text-sm">{qty}</span>
            <button className="p-4" onClick={() => setQty(Math.min(p.stock, 20, qty + 1))} aria-label="+"><Plus className="h-3 w-3" /></button>
          </div>
          <button className="btn-lux flex-1" disabled={p.stock === 0} onClick={onAdd}>
            {p.stock === 0 ? t.outOfStock : added ? t.added : t.addToCart}
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t.freeShippingNote} · {t.cod}</p>

        <div className="mt-14 border-t border-border">
          <div className="flex gap-8 pt-6">
            {(["description", "ingredients", "usage"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`text-[0.7rem] tracking-[0.2em] uppercase ${tab === k ? "text-foreground" : "text-muted-foreground"}`}>
                {t[k]}
              </button>
            ))}
          </div>
          <p className="mt-6 leading-relaxed text-muted-foreground">{content[tab]}</p>
        </div>
      </div>
    </div>
  );
}
