import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD, useI18n } from "@/lib/i18n";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/shipping")({
  staticData: { sitemap: true },
  head: () => pageHead({ path: "/shipping", title: "Livraison gratuite au Maroc & retours | ORRÉA", description: "Livraison gratuite sur tous les produits partout au Maroc, paiement à la livraison et conditions de retour ORRÉA." }),
  component: Shipping,
});

function Shipping() {
  const { L, lang } = useI18n();
  const zones = useQuery({ queryKey: ["zones"], queryFn: async () => (await supabase.from("shipping_zones").select("*").order("city")).data ?? [] });
  return (
    <InfoPage title={L("Livraison & retours", "التوصيل والإرجاع")}>
      <h2>{L("Livraison", "التوصيل")}</h2>
      <p>{L("Livraison gratuite sur tous les produits, sans minimum d'achat. Paiement en espèces à la réception.", "توصيل مجاني على جميع المنتجات، بدون حد أدنى للشراء. الدفع نقداً عند الاستلام.")}</p>
      <p>{L("Livraison partout au Maroc en 24 à 72 h ouvrées.", "توصيل لجميع مدن المغرب خلال 24 إلى 72 ساعة عمل.")}</p>
      {!!zones.data?.length && (
        <ul className="divide-y divide-border border-y border-border">
          {zones.data.map((z) => <li key={z.id} className="flex justify-between py-3"><span>{z.city}</span><span>{Number(z.fee) === 0 ? L("Gratuite", "مجاني") : formatMAD(Number(z.fee), lang)}</span></li>)}
        </ul>
      )}
      <h2>{L("Retours", "الإرجاع")}</h2>
      <p>{L("Vous disposez de 7 jours après réception pour retourner un produit non ouvert. Contactez-nous pour organiser le retour.", "لديك 7 أيام بعد الاستلام لإرجاع منتج غير مفتوح. تواصلي معنا لترتيب الإرجاع.")}</p>
    </InfoPage>
  );
}
