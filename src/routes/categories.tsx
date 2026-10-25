import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productImage, productsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Catégories — THÉRAVÈNE" },
      { name: "description", content: "Explorez les collections mode Femme et Homme THÉRAVÈNE." },
      { property: "og:title", content: "Catégories — THÉRAVÈNE" },
      { property: "og:description", content: "Explorez les univers mode THÉRAVÈNE." },
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:gap-8">
      {cats.filter((c) => c.is_active).map((c) => {
        const img = c.image;
        const name = lang === "ar" ? c.name_ar : c.name_fr;
        return (
          <Link key={c.id} to="/shop" search={{ c: c.slug }} className="card-lux group relative block aspect-[3/4] min-w-0 overflow-hidden border border-border/40 bg-card">
            {img && <img src={productImage(img)} alt={name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]" />}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-2 pb-4 text-center text-ink md:px-4 md:pb-8">
              <p className="text-[0.95rem] leading-tight uppercase tracking-[0.06em] md:text-xl md:tracking-[0.08em] lg:text-[1.45rem]" style={{ fontFamily: "var(--font-display)" }}>{name}</p>
              <span className="mt-2 inline-block border border-ink/35 px-3.5 py-1.5 font-sans text-[0.6rem] tracking-[0.16em] uppercase transition-colors duration-500 group-hover:border-ink group-hover:bg-ink group-hover:text-background md:mt-3 md:px-4 md:py-1.5 md:text-[0.72rem] md:tracking-[0.28em]">
                {lang === "ar" ? "اكتشفي ←" : "Découvrir →"}
              </span>
            </div>
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
      <h1 className="text-[2rem] leading-tight md:text-[2.9rem]">{L("Catégories", "الفئات")}</h1>
      <div className="mt-12"><CategoryGrid /></div>
    </div>
  );
}
