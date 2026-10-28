import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions générales de vente — ORRÉA" },
      { name: "description", content: "Conditions générales de vente de la boutique ORRÉA." },
      { property: "og:title", content: "CGV — ORRÉA" },
      { property: "og:description", content: "Conditions générales de vente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { L } = useI18n();
    return (
      <InfoPage title={L("Conditions générales", "الشروط والأحكام")}>
        <h2>{L("Commandes", "الطلبات")}</h2>
        <p>{L("Toute commande passée sur le site est confirmée par téléphone avant expédition.", "يتم تأكيد كل طلب هاتفياً قبل الشحن.")}</p>
        <h2>{L("Prix", "الأسعار")}</h2>
        <p>{L("Les prix sont indiqués en dirhams marocains (MAD), toutes taxes comprises.", "الأسعار بالدرهم المغربي وتشمل جميع الضرائب.")}</p>
        <h2>{L("Paiement", "الدفع")}</h2>
        <p>{L("Le paiement s'effectue en espèces à la livraison.", "يتم الدفع نقداً عند الاستلام.")}</p>
        <h2>{L("Responsabilité", "المسؤولية")}</h2>
        <p>{L("Consultez les informations de chaque article et respectez les indications d’entretien fournies.", "راجعوا معلومات كل قطعة واتبعوا تعليمات العناية المتوفرة.")}</p>
      </InfoPage>
    );
  },
});
