import { Fragment } from "react";
import { PackCard } from "@/components/site/PackCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import hero from "@/assets/hero.jpg";
import ritual from "@/assets/ritual.jpg";
import { categoriesQuery, productsQuery, type Product } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { settingsQuery, waLink, type Section } from "@/lib/settings";
import { ProductCard } from "@/components/site/ProductCard";
import { CategoryGrid } from "./categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [s] = await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]);
    return { seo: s.seo };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.seo.title_fr || "THÉRAVÈNE — Haute cosmétique";
    const desc = loaderData?.seo.description_fr || "Soins de haute cosmétique d'inspiration française.";
    const og = loaderData?.seo.og_image?.startsWith("https://") ? loaderData.seo.og_image : "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(og ? [{ property: "og:image", content: og }, { name: "twitter:image", content: og }] : []),
      ],
    };
  },
  component: Home,
});

const reviews = [
  { name: "Salma B. — Casablanca", fr: "Le sérum vitamine C a transformé mon teint en trois semaines. Texture divine.", ar: "سيروم فيتامين C غيّر لون بشرتي في ثلاثة أسابيع. قوام رائع." },
  { name: "Imane K. — Rabat", fr: "Livraison rapide, emballage magnifique. On sent le soin dans chaque détail.", ar: "توصيل سريع وتغليف رائع. العناية واضحة في كل التفاصيل." },
  { name: "Nadia E. — Marrakech", fr: "L'huile de nuit est devenue mon rituel. Ma peau est plus douce que jamais.", ar: "زيت الليل أصبح طقسي اليومي. بشرتي أنعم من أي وقت مضى." },
];

function Home() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const sections = s.homepage.sections.filter((x) => x.visible);
  return (
    <>
      {sections.map((sec) => (
        <Fragment key={sec.id}>
          <SectionView sec={sec} />
        </Fragment>
      ))}
    </>
  );
}

function Grid({ title, list, cols = 4 }: { title: string; list: Product[]; cols?: 3 | 4 }) {
  const { t } = useI18n();
  if (!list.length) return null;
  return (
    <section className="mx-auto max-w-[1600px] px-5 pt-14 md:px-10 md:pt-32 lg:px-12 xl:px-16 xl:pt-40">
      <div className="flex items-end justify-between">
        <h2 className="text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title}</h2>
        <Link to="/shop" className="link-lux text-[0.8rem] tracking-[0.12em] uppercase">{t.viewAll}</Link>
      </div>
      <div className={`mt-6 grid grid-cols-2 gap-x-5 gap-y-8 md:gap-x-8 md:gap-y-12 lg:mt-16 lg:gap-x-10 lg:gap-y-16 xl:gap-x-12 ${cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function SectionView({ sec }: { sec: Section }) {
  const { t, lang, L } = useI18n();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: s } = useSuspenseQuery(settingsQuery);
  const ar = lang === "ar";
  const title = (ar ? sec.title_ar : sec.title_fr) ?? "";
  const text = (ar ? sec.text_ar : sec.text_fr) ?? "";
  const [email, setEmail] = useState("");

  switch (sec.type) {
    case "hero":
      return (
        <section className="relative">
          <picture>
            <source media="(min-width:768px)" srcSet={sec.image_desktop || sec.image || hero} />
            <img src={sec.image || hero} alt="THÉRAVÈNE" width={1600} height={1104} className="h-[78vh] min-h-[520px] w-full scale-[1.04] object-cover object-[70%_center] blur-[3px] lg:h-[min(82vh,980px)] lg:min-h-[680px]" />
          </picture>
          <div className="absolute inset-0 mx-auto flex w-full max-w-[1600px] items-end px-5 pb-14 md:items-center md:px-10 md:pb-0 lg:px-12 xl:px-16">
            <div className="max-w-lg animate-rise bg-background/30 p-7 md:bg-transparent md:p-0 lg:max-w-xl">
              <p className="eyebrow">{t.heroEyebrow}</p>
              <h1 className="mt-5 text-[2.1rem] leading-[1.08] md:text-[3rem] xl:text-[3.4rem]">{title}</h1>
              <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed text-foreground lg:max-w-md lg:text-base">{text}</p>
              {(sec.button_fr || sec.button_ar) && (
                <a href={sec.link?.startsWith("/") ? sec.link : "/shop"} className="btn-lux mt-9">{ar ? sec.button_ar : sec.button_fr}</a>
              )}
            </div>
          </div>
        </section>
      );
    case "promo":
      return <div className="bg-champagne/25 px-5 py-4 text-center text-sm tracking-[0.08em]">{title}</div>;
    case "benefits":
      return (
        <section className="border-y border-border bg-card/60">
          <ul className="mx-auto grid max-w-[1600px] grid-cols-2 md:grid-cols-4">
            {t.values.map((v, i) => (
              <li
                key={v}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 px-4 py-9 text-center md:gap-5 md:px-8 md:py-14",
                  i % 2 === 0 && "border-e border-border",
                  i < 2 && "border-b border-border md:border-b-0",
                  i === 1 && "md:border-e md:border-border",
                )}
              >
                <span aria-hidden className="flex shrink-0 items-center gap-2">
                  <span className="h-px w-5 bg-champagne/50" />
                  <span className="h-1 w-1 rotate-45 bg-champagne" />
                  <span className="h-px w-5 bg-champagne/50" />
                </span>
                <span className="font-sans text-[0.68rem] font-medium leading-[1.6] tracking-[0.2em] uppercase text-foreground md:text-[0.74rem] md:tracking-[0.24em]">
                  {v}
                </span>
              </li>
            ))}
          </ul>
        </section>
      );
    case "categories":
      return (
        <section className="mx-auto max-w-[1600px] px-5 pt-28 md:px-10 md:pt-32 lg:px-12 xl:px-16 xl:pt-40">
          <h2 className="mb-10 text-ink text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem] lg:mb-12">{title}</h2>
          <CategoryGrid />
        </section>
      );
    case "offers":
      return (
        <section className="pt-14 md:pt-32 xl:pt-40">
          <div className="mx-auto mb-6 max-w-[1600px] px-5 text-center md:mb-12 md:px-10 lg:mb-16 lg:px-12 xl:px-16">
            <p className="eyebrow">{L("Packs THÉRAVÈNE", "باكات THÉRAVÈNE")}</p>
            <h2 className="mt-3 md:mt-4 text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title || L("Offres", "العروض")}</h2>
          </div>
          <PackCard />
        </section>
      );
    case "featured": {
      const isPack = (p: Product) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0;
      const list = products.filter((p) => !isPack(p));
      return <Grid title={title} list={list} />;
    }
    case "bestsellers":
      return <Grid title={title} list={products.filter((p) => p.is_bestseller).slice(0, 3)} cols={3} />;
    case "new": {
      const isPack = (p: Product) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0;
      return <Grid title={title} list={products.filter((p) => p.is_new && !isPack(p)).slice(0, 4)} />;
    }
    case "story":
      return (
        <section className="mx-auto mt-32 grid max-w-[1600px] items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10 lg:px-12 xl:mt-40 xl:gap-28 xl:px-16">
          <img src={sec.image || ritual} alt="" loading="lazy" width={1200} height={1408} className="aspect-[4/5] w-full object-cover" />
          <div>
            <p className="eyebrow">{t.ritualEyebrow}</p>
            <h2 className="mt-5 text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title}</h2>
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground lg:text-lg">{text}</p>
            <Link to="/about" className="btn-ghost-lux mt-10">{t.about}</Link>
          </div>
        </section>
      );
    case "panel": {
      if (!sec.image) return null;
      const btn = (ar ? sec.button_ar : sec.button_fr) ?? "";
      return (
        <section className="mt-32 xl:mt-40">
          <div className="relative">
            <img src={sec.image} alt={title || "THÉRAVÈNE"} width={1672} height={941} loading="lazy" className="block h-auto w-full" />
          </div>
          <div className="mx-auto max-w-[1600px] px-5 md:px-10 lg:px-12 xl:px-16">
            <div className="plate-lux relative z-10 mx-auto max-w-3xl bg-background px-6 py-8 text-center md:-mt-10 md:px-12 md:py-10">
              <p className="eyebrow">THÉRAVÈNE</p>
              <h2 className="mt-4 text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title}</h2>
              {text && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-base">{text}</p>}
              {btn && <a href={sec.link?.startsWith("/") ? sec.link : "/shop"} className="btn-lux mt-8">{btn}</a>}
            </div>
          </div>
        </section>
      );
    }
    case "reviews":
      return (
        <section className="mx-auto max-w-[1600px] px-5 pt-32 md:px-10 lg:px-12 xl:px-16 xl:pt-40">
          <h2 className="text-center text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title}</h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3 lg:gap-16 xl:mt-20 xl:gap-20">
            {reviews.map((r) => (
              <figure key={r.name} className="border-t border-border pt-8">
                <p className="text-champagne">★★★★★</p>
                <blockquote className="mt-4 text-xl leading-snug lg:text-2xl" style={{ fontFamily: "var(--font-display)" }}>« {ar ? r.ar : r.fr} »</blockquote>
                <figcaption className="eyebrow mt-6">{r.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    case "newsletter":
      return (
        <section className="mx-auto mt-32 max-w-3xl px-5 text-center xl:mt-40">
          <h2 className="text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title}</h2>
          <p className="mt-4 text-muted-foreground">{text}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (s.store.whatsapp && /^\S+@\S+\.\S+$/.test(email)) window.open(waLink(s.store.whatsapp, `Newsletter: ${email.slice(0, 120)}`), "_blank", "noopener");
            }}
            className="mx-auto mt-10 flex max-w-md gap-3"
          >
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="field-lux flex-1" />
            <button className="btn-lux">{L("S'inscrire", "اشتراك")}</button>
          </form>
          {s.store.instagram && <a href={s.store.instagram} target="_blank" rel="noreferrer" className="link-lux mt-10 inline-block text-xs tracking-[0.16em] uppercase">Instagram · @theraven</a>}
        </section>
      );
    default:
      return null;
  }
}
