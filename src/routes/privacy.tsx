import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — ORRÉA" },
      { name: "description", content: "Comment ORRÉA collecte et protège vos données personnelles." },
      { property: "og:title", content: "Confidentialité — ORRÉA" },
      { property: "og:description", content: "Protection de vos données personnelles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { L } = useI18n();
    return (
      <InfoPage title={L("Politique de confidentialité", "سياسة الخصوصية")}>
        <h2>{L("Données collectées", "البيانات التي نجمعها")}</h2>
        <p>{L("Nous collectons uniquement les informations nécessaires au traitement de vos commandes : nom, téléphone, e-mail, adresse de livraison.", "نجمع فقط المعلومات اللازمة لمعالجة طلباتك: الاسم والهاتف والبريد الإلكتروني وعنوان التوصيل.")}</p>
        <h2>{L("Utilisation", "الاستخدام")}</h2>
        <p>{L("Vos données servent à livrer vos commandes et à vous contacter à leur sujet. Elles ne sont jamais vendues.", "تُستخدم بياناتك لتوصيل طلباتك والتواصل معك بشأنها، ولا تُباع أبداً.")}</p>
        <h2>{L("Vos droits", "حقوقك")}</h2>
        <p>{L("Conformément à la loi 09-08, vous pouvez demander l'accès, la rectification ou la suppression de vos données via notre page Contact.", "وفقاً للقانون 09-08، يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها عبر صفحة الاتصال.")}</p>
      </InfoPage>
    );
  },
});
