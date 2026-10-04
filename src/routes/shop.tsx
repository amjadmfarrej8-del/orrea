import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { categoriesQuery, productsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/site/ProductCard";
import { PackCard, isPack } from "@/components/site/PackCard";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({
    c: z.string().max(60).optional(),
    q: z.string().max(80).optional(),
    sort: z.enum(["new", "price-asc", "price-desc"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Boutique — THÉRAVÉN" },
      { name: "description", content: "Toute la collection THÉRAVÉN : soins visage, sérums, corps et parfums." },
      { property: "og:title", content: "Boutique — THÉRAVÉN" },
      { property: "og:description", content: "Découvrez toute la collection de haute cosmétique THÉRAVÉN." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(productsQuery), context.queryClient.ensureQueryData(categoriesQuery)]),
  component: Shop,
});

function Shop() {
  const { t, lang, L } = useI18n();
  const { c, q, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const needle = q?.toLowerCase().trim();
  const offers = c === "offres";
  const matches = (p: (typeof products)[number]) =>
    !needle || [p.name_fr, p.name_ar, p.sku, p.ingredients_fr, p.tagline_fr].some((f) => f.toLowerCase().includes(needle));
  let list = products.filter((p) => !isPack(p) && !offers && (!c || p.categories?.slug === c) && matches(p));
  if (sort === "price-asc") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "new") list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const packIds = products.filter((p) => isPack(p) && matches(p)).map((p) => p.id);
  const showPacks = (!c || offers) && packIds.length > 0;
  const excluded = products.filter((p) => isPack(p) && !packIds.includes(p.id)).map((p) => p.id);

  const pill = (active: boolean) =>
    `whitespace-nowrap border px-3.5 py-2 text-[0.72rem] tracking-[0.12em] uppercase transition-colors md:px-4 md:text-[0.76rem] ${
      active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10">
      <nav className="font-sans text-[0.7rem] tracking-[0.12em] text-muted-foreground uppercase"><Link to="/" className="hover:text-foreground">{L("Accueil", "الرئيسية")}</Link> / <span className="text-foreground">{t.shop}</span></nav>
      <h1 className="mt-4 text-5xl md:text-7xl">{t.shop}</h1>
      <p className="mt-3 font-sans text-sm text-muted-foreground">{L(`${list.length + (showPacks ? packIds.length : 0)} articles`, `${list.length + (showPacks ? packIds.length : 0)} منتجات`)}</p>
      {q && <p className="mt-4 text-muted-foreground">{L("Résultats pour", "نتائج البحث عن")} « {q} » · {list.length + (showPacks ? packIds.length : 0)}</p>}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="-mx-5 flex max-w-[calc(100%+2.5rem)] gap-2.5 overflow-x-auto px-5 pb-2 md:mx-0 md:max-w-full md:gap-3 md:px-0">
          <Link to="/shop" search={{ q, sort }} className={pill(!c)}>{t.all}</Link>
          <Link to="/shop" search={{ c: "offres", q, sort }} className={`${pill(offers)} ${offers ? "" : "border-champagne text-foreground"}`}>{L("Offres", "العروض")}</Link>
          {cats.map((cat) => (
            <Link key={cat.id} to="/shop" search={{ c: cat.slug, q, sort }} className={pill(c === cat.slug)}>
              {lang === "ar" ? cat.name_ar : cat.name_fr}
            </Link>
          ))}
        </div>
        {!offers && (
          <select
            value={sort ?? ""}
            onChange={(e) => navigate({ search: (s) => ({ ...s, sort: (e.target.value || undefined) as never }) })}
            className="border-b border-input bg-transparent py-2 text-xs tracking-[0.15em] uppercase outline-none"
          >
            <option value="">{L("Trier", "ترتيب")}</option>
            <option value="new">{L("Nouveautés", "الأحدث")}</option>
            <option value="price-asc">{L("Prix croissant", "السعر تصاعدياً")}</option>
            <option value="price-desc">{L("Prix décroissant", "السعر تنازلياً")}</option>
          </select>
        )}
      </div>
      {showPacks && <div className="-mx-5 mt-12 md:-mx-10"><PackCard excludeIds={excluded} /></div>}
      {list.length === 0 && !showPacks && <p className="mt-16 text-muted-foreground">{L("Aucun produit trouvé.", "لم يتم العثور على أي منتج.")}</p>}
      {list.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8 xl:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
