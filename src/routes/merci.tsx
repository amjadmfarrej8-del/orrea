import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/merci")({
  validateSearch: z.object({ n: z.string().max(20).optional() }),
  head: () => ({
    meta: [
      { title: "Merci — THÉRAVÉN" },
      { name: "description", content: "Votre commande THÉRAVÉN est confirmée." },
      { property: "og:title", content: "Merci — THÉRAVÉN" },
      { property: "og:description", content: "Commande confirmée." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Thanks,
});

function Thanks() {
  const { t } = useI18n();
  const { n } = Route.useSearch();
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center animate-rise">
      <p className="eyebrow">THÉRAVÉN</p>
      <h1 className="mt-5 text-5xl">{t.thanksTitle}</h1>
      {n && (
        <p className="mt-8 text-sm">
          {t.orderNumber} : <span className="tracking-[0.15em]">{n}</span>
        </p>
      )}
      <p className="mt-4 text-muted-foreground">{t.thanksText}</p>
      <Link to="/shop" className="btn-ghost-lux mt-10">{t.continueShopping}</Link>
    </div>
  );
}
