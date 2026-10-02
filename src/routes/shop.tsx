import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { categoriesQuery, productsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({ c: z.string().optional() }),
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
  const { t, lang } = useI18n();
  const { c } = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const list = c ? products.filter((p) => p.categories?.slug === c) : products;

  const pill = (active: boolean) =>
    `whitespace-nowrap border px-4 py-2 text-[0.68rem] tracking-[0.2em] uppercase transition-colors ${
      active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10">
      <h1 className="text-5xl md:text-7xl">{t.shop}</h1>
      <div className="mt-10 flex gap-3 overflow-x-auto pb-2">
        <Link to="/shop" search={{}} className={pill(!c)}>{t.all}</Link>
        {cats.map((cat) => (
          <Link key={cat.id} to="/shop" search={{ c: cat.slug }} className={pill(c === cat.slug)}>
            {lang === "ar" ? cat.name_ar : cat.name_fr}
          </Link>
        ))}
      </div>
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 md:gap-x-8">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
