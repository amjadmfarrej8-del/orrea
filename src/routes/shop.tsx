import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { categoriesQuery, productsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/site/ProductCard";
import { PackCard } from "@/components/site/PackCard";

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
  let list = products.filter((p) => (!c || p.categories?.slug === c) &&
    (!needle || [p.name_fr, p.name_ar, p.sku, p.ingredients_fr, p.tagline_fr].some((f) => f.toLowerCase().includes(needle))));
  if (sort === "price-asc") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "new") list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const pill = (active: boolean) =>
    `whitespace-nowrap border px-4 py-2 text-[0.76rem] tracking-[0.12em] uppercase transition-colors ${
      active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10">
      <h1 className="text-5xl md:text-7xl">{t.shop}</h1>
      {q && <p className="mt-4 text-muted-foreground">{L("Résultats pour", "نتائج البحث عن")} « {q} » · {list.length}</p>}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Link to="/shop" search={{ q, sort }} className={pill(!c)}>{t.all}</Link>
          {cats.map((cat) => (
            <Link key={cat.id} to="/shop" search={{ c: cat.slug, q, sort }} className={pill(c === cat.slug)}>
              {lang === "ar" ? cat.name_ar : cat.name_fr}
            </Link>
          ))}
        </div>
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
      </div>
      {!q && <div className="-mx-5 mt-12 md:-mx-10"><PackCard productIds={c ? products.filter((p) => p.categories?.slug === c).map((p) => p.id) : undefined} /></div>}
      {list.length === 0 && <p className="mt-16 text-muted-foreground">{L("Aucun produit trouvé.", "لم يتم العثور على أي منتج.")}</p>}
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 md:gap-x-8">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
