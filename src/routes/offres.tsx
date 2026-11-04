import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PackCard } from "@/components/site/PackCard";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/offres")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/offres", title: "Offres et coffrets mode au Maroc | ORRÉA", description: "Les offres et coffrets du moment chez ORRÉA, avec livraison gratuite au Maroc et paiement à la livraison." }),
  component: OffresPage,
});

function OffresPage() {
  const { L } = useI18n();
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16 lg:px-12 xl:px-16">
      <p className="eyebrow">{L("ORRÉA", "ORRÉA")}</p>
      <h1 className="mt-3 text-[2rem] leading-tight md:text-[2.9rem]" style={{ fontFamily: "var(--font-display)" }}>
        {L("Offres", "العروض")}
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        {L(
          "Retrouvez ici les offres disponibles sur notre sélection.",
          "اكتشفوا العروض المتاحة على مختاراتنا."
        )}
      </p>
      <div className="mt-10">
        <PackCard />
      </div>
    </div>
  );
}
