import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productImage, productsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Catégories — THÉRAVÉN" },
      { name: "description", content: "Soins visage, sérums, corps et parfums THÉRAVÉN." },
      { property: "og:title", content: "Catégories — THÉRAVÉN" },
      { property: "og:description", content: "Explorez nos univers de soin." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(productsQuery)]),
  component: Categories,
});

export function CategoryGrid() {
  const { lang } = useI18n();
  const { data: cats } = useSuspenseQuery(categoriesQuery);
    return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-8">
      {cats.filter((c) => c.is_active).map((c) => {
        const img = c.image;
        return (
          <Link key={c.id} to="/shop" search={{ c: c.slug }} className="group block">
            <div className="aspect-[3/4] overflow-hidden bg-card">
              {img && <img src={productImage(img)} alt={lang === "ar" ? c.name_ar : c.name_fr} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]" />}
            </div>
            <p className="mt-2 text-center text-sm md:mt-4 md:text-2xl" style={{ fontFamily: "var(--font-display)" }}>{lang === "ar" ? c.name_ar : c.name_fr}</p>
          </Link>
        );
      })}
    </div>
  );
}

function Categories() {
  const { L } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10">
      <h1 className="text-5xl md:text-7xl">{L("Catégories", "الفئات")}</h1>
      <div className="mt-12"><CategoryGrid /></div>
    </div>
  );
}
