import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD, useI18n } from "@/lib/i18n";
import { settingsQuery } from "@/lib/settings";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Livraison & retours — THÉRAVÈNE" },
      { name: "description", content: "Tarifs de livraison au Maroc, délais et politique de retour THÉRAVÈNE." },
      { property: "og:title", content: "Livraison & retours — THÉRAVÈNE" },
      { property: "og:description", content: "Livraison partout au Maroc, paiement à la livraison." },
    ],
  }),
  component: Shipping,
});

function Shipping() {
  const { L, lang } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const zones = useQuery({ queryKey: ["zones"], queryFn: async () => (await supabase.from("shipping_zones").select("*").order("city")).data ?? [] });
  return (
    <InfoPage title={L("Livraison & retours", "التوصيل والإرجاع")}>
      <h2>{L("Livraison", "التوصيل")}</h2>
      <p>{L("Livraison partout au Maroc en 24 à 72 h ouvrées. Paiement en espèces à la réception.", "توصيل لجميع مدن المغرب خلال 24 إلى 72 ساعة عمل. الدفع نقداً عند الاستلام.")}</p>
      {s && (
        <p>
          {L("Tarif standard :", "السعر العادي:")} {formatMAD(s.store.shipping_fee, lang)} · {L("offerte dès", "مجاني ابتداءً من")} {formatMAD(s.store.free_shipping_threshold, lang)}
        </p>
      )}
      {!!zones.data?.length && (
        <ul className="divide-y divide-border border-y border-border">
          {zones.data.map((z) => <li key={z.id} className="flex justify-between py-3"><span>{z.city}</span><span>{formatMAD(Number(z.fee), lang)}</span></li>)}
        </ul>
      )}
      <h2>{L("Retours", "الإرجاع")}</h2>
      <p>{L("Vous disposez de 7 jours après réception pour retourner un produit non ouvert. Contactez-nous pour organiser le retour.", "لديك 7 أيام بعد الاستلام لإرجاع منتج غير مفتوح. تواصلي معنا لترتيب الإرجاع.")}</p>
    </InfoPage>
  );
}
