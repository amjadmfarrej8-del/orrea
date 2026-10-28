import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { settingsQuery } from "@/lib/settings";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Questions fréquentes — ORRÉA" },
      { name: "description", content: "Livraison, paiement à la livraison, retours et conseils produits ORRÉA." },
      { property: "og:title", content: "FAQ — ORRÉA" },
      { property: "og:description", content: "Toutes les réponses à vos questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Faq,
});

function Faq() {
  const { L } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const fee = s?.store.shipping_fee ?? 20;
  const free = s?.store.free_shipping_threshold ?? 500;
  const items = [
    [L("Comment payer ma commande ?", "كيف أدفع ثمن طلبي؟"), L("Le paiement se fait en espèces à la livraison, directement au livreur.", "يتم الدفع نقداً عند الاستلام مباشرة لعامل التوصيل.")],
    [L("Quels sont les délais de livraison ?", "ما هي مدة التوصيل؟"), L("24 à 72 h ouvrées selon votre ville au Maroc.", "من 24 إلى 72 ساعة عمل حسب مدينتك في المغرب.")],
    [L("Combien coûte la livraison ?", "كم تكلفة التوصيل؟"), L(`${fee} MAD, offerte dès ${free} MAD d'achat.`, `${fee} درهم، ومجانية ابتداءً من ${free} درهم.`)],
    [L("Puis-je retourner un produit ?", "هل يمكنني إرجاع منتج؟"), L("Oui, sous 7 jours si le produit est non ouvert et dans son emballage d'origine.", "نعم، خلال 7 أيام إذا كان المنتج غير مفتوح وفي غلافه الأصلي.")],
    [L("Où trouver les informations sur un article ?", "أين أجد معلومات القطعة؟"), L("La fiche de chaque article présente les informations disponibles, son prix et sa disponibilité. Pour une précision, contactez-nous avant de commander.", "تعرض صفحة كل قطعة المعلومات المتاحة وسعرها وتوفرها. تواصلوا معنا قبل الطلب لأي استفسار.")],
    [L("Comment suivre ma commande ?", "كيف أتتبع طلبي؟"), L("Depuis la page « Suivi de commande », avec votre numéro et votre téléphone.", "من صفحة «تتبع الطلب» برقم الطلب ورقم هاتفك.")],
  ];
  return (
    <InfoPage eyebrow="FAQ" title={L("Questions fréquentes", "الأسئلة الشائعة")}>
      {items.map(([q, a]) => (
        <details key={q} className="group border-b border-border pb-6">
          <summary className="cursor-pointer list-none text-xl text-foreground" style={{ fontFamily: "var(--font-display)" }}>{q}</summary>
          <p className="mt-3">{a}</p>
        </details>
      ))}
    </InfoPage>
  );
}
