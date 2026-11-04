import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import ritual from "@/assets/fashion-homme.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/about", title: "La Maison ORRÉA — Marque de mode streetwear au Maroc", description: "Découvrez ORRÉA, marque de mode en ligne au Maroc : streetwear homme et vêtements femme pensés pour un style simple et affirmé." }),
  component: About,
});

function About() {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-16 md:grid-cols-2 md:gap-20 md:px-10">
      <div>
        <p className="eyebrow">{t.about}</p>
        <h1 className="mt-5 text-[2rem] leading-tight md:text-[2.9rem]">{t.aboutTitle}</h1>
        <p className="mt-8 max-w-md leading-relaxed text-muted-foreground">{t.aboutText}</p>
        <Link to="/shop" className="btn-lux mt-10">{t.discover}</Link>
      </div>
      <img src={ritual} alt="Univers mode ORRÉA" width={1200} height={1408} className="aspect-[4/5] w-full object-cover" />
    </div>
  );
}
