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
    <div className="grid grid-cols-3 gap-2 md:gap-6 lg:gap-8">
      {cats.filter((c) => c.is_active).map((c) => {
        const img = c.image;
        const name = lang === "ar" ? c.name_ar : c.name_fr;
        return (
          <Link key={c.id} to="/shop" search={{ c: c.slug }} className="card-lux group relative block aspect-[3/4] min-w-0 overflow-hidden border border-border/40 bg-card">
            {img && <img src={productImage(img)} alt={name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]" />}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-1.5 pb-3 text-center text-ink md:px-4 md:pb-8">
              <p className="text-[0.72rem] leading-tight uppercase tracking-[0.06em] md:text-xl md:tracking-[0.08em] lg:text-[1.45rem]" style={{ fontFamily: "var(--font-display)" }}>{name}</p>
              <span className="mt-1.5 font-sans text-[0.5rem] tracking-[0.18em] uppercase md:mt-3 md:text-[0.72rem] md:tracking-[0.28em]">
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
