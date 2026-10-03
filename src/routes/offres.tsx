import { createFileRoute } from "@tanstack/react-router";
import { PackCard } from "@/components/site/PackCard";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/offres")({
  head: () => ({
    meta: [
      { title: "Offres & Packs — THÉRAVÉN" },
      { name: "description", content: "Découvrez les packs et offres exclusives THÉRAVÉN : des routines complètes à prix réduit, livraison offerte." },
      { property: "og:title", content: "Offres & Packs — THÉRAVÉN" },
      { property: "og:description", content: "Découvrez les packs et offres exclusives THÉRAVÉN : des routines complètes à prix réduit, livraison offerte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OffresPage,
});

function OffresPage() {
  const { L } = useI18n();
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16 lg:px-12 xl:px-16">
      <p className="eyebrow">{L("Packs THÉRAVÉN", "باكات THÉRAVÉN")}</p>
      <h1 className="mt-3 text-4xl md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
        {L("Offres", "العروض")}
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        {L(
          "Des routines complètes réunies en packs à prix réduit, avec la livraison offerte.",
          "روتينات كاملة مجمعة في باكات بأسعار مخفضة، مع توصيل مجاني."
        )}
      </p>
      <div className="mt-10">
        <PackCard />
      </div>
    </div>
  );
}
