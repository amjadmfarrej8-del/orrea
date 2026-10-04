import { createFileRoute, Link } from "@tanstack/react-router";
import ritual from "@/assets/ritual.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "La Maison — THÉRAVÈNE" },
      { name: "description", content: "L'histoire et la philosophie de THÉRAVÈNE, maison de haute cosmétique." },
      { property: "og:title", content: "La Maison — THÉRAVÈNE" },
      { property: "og:description", content: "Rigueur de la formulation française, richesse des ingrédients précieux." },
    ],
  }),
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
      <img src={ritual} alt="" width={1200} height={1408} className="aspect-[4/5] w-full object-cover" />
    </div>
  );
}
