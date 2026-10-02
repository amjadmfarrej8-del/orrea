import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/hero.jpg";
import ritual from "@/assets/ritual.jpg";
import { productsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THÉRAVÉN — Haute cosmétique d'inspiration française" },
      { name: "description", content: "Sérums, crèmes et huiles précieuses THÉRAVÉN. Livraison partout au Maroc, paiement à la livraison." },
      { property: "og:title", content: "THÉRAVÉN — Haute cosmétique" },
      { property: "og:description", content: "Soins d'exception formulés avec des actifs précieux. Livraison au Maroc." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { data: products } = useSuspenseQuery(productsQuery);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const best = products.filter((p) => p.is_bestseller).slice(0, 3);

  return (
    <>
      <section className="relative">
        <img src={hero} alt="THÉRAVÉN" width={1600} height={1104} className="h-[78vh] min-h-[520px] w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 mx-auto flex max-w-7xl items-end px-5 pb-14 md:items-center md:px-10 md:pb-0">
          <div className="max-w-lg animate-rise bg-background/80 p-7 backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none">
            <p className="eyebrow">{t.heroEyebrow}</p>
            <h1 className="mt-5 text-5xl leading-[1.02] md:text-7xl">{t.heroTitle}</h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.heroText}</p>
            <Link to="/shop" className="btn-lux mt-9">{t.discover}</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {t.values.map((v) => (
            <li key={v} className="border-border px-4 py-6 text-center text-[0.68rem] tracking-[0.2em] uppercase text-muted-foreground [&:not(:last-child)]:border-e">
              {v}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-28 md:px-10">
        <div className="flex items-end justify-between">
          <h2 className="text-4xl md:text-5xl">{t.featured}</h2>
          <Link to="/shop" className="link-lux text-[0.72rem] tracking-[0.2em] uppercase">{t.viewAll}</Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto mt-32 grid max-w-7xl items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10">
        <img src={ritual} alt="" loading="lazy" width={1200} height={1408} className="aspect-[4/5] w-full object-cover" />
        <div>
          <p className="eyebrow">{t.ritualEyebrow}</p>
          <h2 className="mt-5 text-4xl leading-tight md:text-6xl">{t.ritualTitle}</h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">{t.ritualText}</p>
          <ol className="mt-10 space-y-5 border-t border-border pt-8">
            {best.map((p, i) => (
              <li key={p.id} className="flex items-baseline gap-6">
                <span className="text-champagne text-2xl" style={{ fontFamily: "var(--font-display)" }}>0{i + 1}</span>
                <Link to="/products/$slug" params={{ slug: p.slug }} className="link-lux text-lg">
                  {p.name_fr}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-32 md:px-10">
        <h2 className="text-4xl md:text-5xl">{t.bestsellers}</h2>
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8">
          {best.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}
