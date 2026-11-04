import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/terms", title: "Conditions générales de vente | ORRÉA", description: "Conditions générales de vente de la boutique de mode en ligne ORRÉA au Maroc." }),
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
