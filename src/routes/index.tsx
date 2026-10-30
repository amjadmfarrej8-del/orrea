import { Fragment } from "react";
import { PackCard } from "@/components/site/PackCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import hero from "@/assets/streetwear-campaign.jpg";
import mobileHero from "@/assets/streetwear-campaign-mobile.jpg";
import { ArrowRight, ChevronLeft, ChevronRight, Truck, ShieldCheck, PackageCheck } from "lucide-react";
import ritual from "@/assets/fashion-femme.jpg";
import { categoriesQuery, productImage, productsQuery, type Product } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { settingsQuery, waLink, type Section } from "@/lib/settings";
import { ProductCard } from "@/components/site/ProductCard";
import { CategoryGrid } from "./categories";
import { Button } from "@/components/ui/button";

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
    const title = loaderData?.seo.title_fr || "ORRÉA — Mode Femme & Homme";
    const desc = loaderData?.seo.description_fr || "Découvrez les univers mode Femme et Homme de ORRÉA.";
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


function Home() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const sections = s.homepage.sections.filter((x) => x.visible && x.type !== "reviews");
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
  const [photo, setPhoto] = useState(0);

  switch (sec.type) {
    case "hero": {
      const slides = products.filter((p) => p.gallery?.length).flatMap((p) => [p.image, ...(p.gallery || [])]).filter(Boolean).slice(0, 2);
      const campaignImages = [hero, ...slides];
      const selected = photo % campaignImages.length;
      const isDefault = !sec.image || sec.image === "streetwear-campaign";
      const headline = title || "MOVE WITH PRESENCE";
      const words = headline.split(" ");
      const last = words.pop();
      return (
        <section className="streetwear-hero">
          <picture>
            <source media="(min-width:768px)" srcSet={selected === 0 ? productImage(sec.image_desktop || sec.image || hero) : productImage(campaignImages[selected] ?? hero)} />
            <img src={selected === 0 ? (isDefault ? mobileHero : productImage(sec.image || hero)) : productImage(campaignImages[selected] ?? hero)} alt="Ensemble ORRÉA blanc et orange" width={848} height={1264} fetchPriority="high" className="streetwear-hero-image" />
          </picture>
          <div className="streetwear-shade" aria-hidden />
          <div className="streetwear-copy">
            <p className="mb-4 flex items-center gap-3 text-[10px] uppercase md:text-xs">PREMIUM STREETWEAR <span className="h-px w-10 bg-foreground/60" /></p>
            <h1 className="streetwear-title">{words.join(" ")}<span>{last}</span></h1>
            <p className="mt-4 text-[10px] uppercase md:text-sm">{text}</p>
            <Button asChild variant="outline" className="mt-6 h-11 rounded-none border-primary bg-transparent px-4 text-[10px] uppercase text-foreground hover:bg-primary hover:text-primary-foreground md:h-14 md:px-7 md:text-xs">
              <Link to="/shop">{(ar ? sec.button_ar : sec.button_fr) || L("Découvrir la collection", "اكتشفوا المجموعة")}<ArrowRight className="ms-3 size-4" /></Link>
            </Button>
          </div>
          <div className="absolute bottom-5 start-6 flex items-center gap-4 text-xs md:bottom-8 md:start-12">
            <span className="tabular-nums">{String(selected + 1).padStart(2, "0")} / {String(campaignImages.length).padStart(2, "0")}</span>
            <span className="h-px w-14 bg-foreground/50" />
            <Button size="icon" variant="ghost" aria-label={L("Photo précédente", "الصورة السابقة")} onClick={() => setPhoto((selected + campaignImages.length - 1) % campaignImages.length)}><ChevronLeft className="size-4" /></Button>
            <Button size="icon" variant="ghost" aria-label={L("Photo suivante", "الصورة التالية")} onClick={() => setPhoto((selected + 1) % campaignImages.length)}><ChevronRight className="size-4" /></Button>
          </div>
        </section>
      );
    }
    case "promo":
      return <div className="bg-champagne/25 px-5 py-4 text-center text-sm tracking-[0.08em]">{title}</div>;
    case "benefits": {
      const benefits = [
        { icon: Truck, title: L("Livraison au Maroc", "التوصيل في المغرب"), detail: L(`${s.store.shipping_fee} MAD · offerte dès ${s.store.free_shipping_threshold} MAD`, `${s.store.shipping_fee} درهم · مجاناً من ${s.store.free_shipping_threshold} درهم`) },
        { icon: ShieldCheck, title: L("Paiement à la livraison", "الدفع عند الاستلام"), detail: L("À réception de votre commande", "عند استلام طلبكم") },
        { icon: PackageCheck, title: L("Suivi de commande", "تتبع الطلب"), detail: L("Votre commande, étape par étape", "طلبكم خطوة بخطوة") },
      ];
      return <section className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 py-7 md:py-12">{benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="text-center"><Icon className="mx-auto mb-3 size-6 md:size-9" strokeWidth={1.2} /><p className="text-[9px] font-medium uppercase leading-tight md:text-xs">{title}</p><p className="mt-1 text-[9px] leading-tight text-muted-foreground md:text-xs">{detail}</p></div>)}</section>;
    }
    case "categories":
      return (
        <section className="bg-street-black py-12 md:py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-10">
            <div className="mb-8 text-center md:mb-12"><p className="mb-2 text-[10px] font-medium uppercase text-primary">ORRÉA</p><h2 className="streetwear-heading">{title}</h2><span className="mx-auto mt-3 block h-px w-10 bg-primary/80" /></div>
            <CategoryGrid />
          </div>
        </section>
      );
    case "offers":
      return (
        <section className="pt-14 md:pt-32 xl:pt-40">
          <div className="mx-auto mb-6 max-w-[1600px] px-5 text-center md:mb-12 md:px-10 lg:mb-16 lg:px-12 xl:px-16">
            <p className="eyebrow">{L("Packs ORRÉA", "باكات ORRÉA")}</p>
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
      return <Grid title={title} list={products.filter((p) => p.is_bestseller).slice(0, 4)} />;
    case "new": {
      const isPack = (p: Product) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0;
      return <Grid title={title} list={products.filter((p) => p.is_new && !isPack(p)).slice(0, 4)} />;
    }
    case "story":
      return (
        <section className="mx-auto mt-32 grid max-w-[1600px] items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10 lg:px-12 xl:mt-40 xl:gap-28 xl:px-16">
          <img src={productImage(sec.image || ritual)} alt="" loading="lazy" width={1200} height={1408} className="aspect-[4/5] w-full object-cover" />
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
            <img src={productImage(sec.image)} alt={title || "ORRÉA"} width={1672} height={941} loading="lazy" className="block h-auto w-full" />
          </div>
          <div className="mx-auto max-w-[1600px] px-5 md:px-10 lg:px-12 xl:px-16">
            <div className="plate-lux relative z-10 mx-auto max-w-3xl bg-background px-6 py-8 text-center md:-mt-10 md:px-12 md:py-10">
              <p className="eyebrow">ORRÉA</p>
              <h2 className="mt-4 text-[1.6rem] leading-snug md:text-[2.1rem] xl:text-[2.3rem]">{title}</h2>
              {text && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-base">{text}</p>}
              {btn && <a href={sec.link?.startsWith("/") ? sec.link : "/shop"} className="btn-lux mt-8">{btn}</a>}
            </div>
          </div>
        </section>
      );
    }
    case "newsletter":
      if (!s.store.whatsapp) return null;
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
          {s.store.instagram && <a href={s.store.instagram} target="_blank" rel="noreferrer" className="link-lux mt-10 inline-block text-xs tracking-[0.16em] uppercase">Instagram</a>}
        </section>
      );
    default:
      return null;
  }
}
