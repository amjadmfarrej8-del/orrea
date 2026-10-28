import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productImage, productsQuery } from "@/lib/catalog";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Catégories — ORRÉA" },
      { name: "description", content: "Explorez les collections mode Femme et Homme ORRÉA." },
      { property: "og:title", content: "Catégories — ORRÉA" },
      { property: "og:description", content: "Explorez les univers mode ORRÉA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(productsQuery)]),
  component: Categories,
});

export function CategoryGrid() {
  const { lang } = useI18n();
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  return (
    <div className="cat-row" role="list">
      {cats.filter((c) => c.is_active).map((c) => {
        const name = lang === "ar" ? c.name_ar : c.name_fr;
        return (
          <Link key={c.id} to="/shop" search={{ c: c.slug }} role="listitem" className="group flex flex-col items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:gap-4">
            <span className="block aspect-square w-full overflow-hidden rounded-full border border-primary/70 transition-colors duration-500 group-hover:border-primary">
              {c.image && <img src={productImage(c.image)} alt={name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
            </span>
            <span className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-foreground md:text-sm">{name}</span>
            <span className="flex size-8 items-center justify-center rounded-full border border-primary text-foreground transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground md:size-9">
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function Categories() {
  const { L } = useI18n();
  return (
    <div className="bg-street-black">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <h1 className="streetwear-heading text-center">{L("Catégories", "الفئات")}</h1>
        <div className="mt-12 md:mt-16"><CategoryGrid /></div>
      </div>
    </div>
  );
}
