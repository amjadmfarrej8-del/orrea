import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { formatMAD, useI18n } from "@/lib/i18n";
import { settingsQuery, waLink } from "@/lib/settings";

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

type Last = { number: string; total: number; name: string; city: string; address: string; shipping: number; discount: number; items: { name: string; name_ar: string; qty: number; price: number }[] };

function Thanks() {
  const { t, L, lang } = useI18n();
  const { n } = Route.useSearch();
  const { data: s } = useQuery(settingsQuery);
  const [o, setO] = useState<Last | null>(null);
  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem("th-last-order") ?? "null") as Last | null;
      if (v && v.number === n) setO(v);
    } catch { /* ignore */ }
  }, [n]);

  return (
    <div className="mx-auto max-w-xl px-5 py-24 animate-rise">
      <p className="eyebrow text-center">THÉRAVÉN</p>
      <h1 className="mt-5 text-center text-5xl">{t.thanksTitle}{o ? `, ${o.name.split(" ")[0]}` : ""}</h1>
      {n && <p className="mt-8 text-center text-sm">{t.orderNumber} : <span className="tracking-[0.15em]">{n}</span></p>}
      <p className="mt-4 text-center text-muted-foreground">{t.thanksText}</p>
      {o && (
        <div className="mt-12 bg-card p-7 text-sm">
          <ul className="space-y-2">
            {o.items.map((i, k) => <li key={k} className="flex justify-between"><span>{lang === "ar" ? i.name_ar : i.name} × {i.qty}</span><span>{formatMAD(i.price * i.qty, lang)}</span></li>)}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex justify-between"><dt>{t.shipping}</dt><dd>{o.shipping === 0 ? t.free : formatMAD(o.shipping, lang)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between"><dt>{L("Remise", "الخصم")}</dt><dd>−{formatMAD(o.discount, lang)}</dd></div>}
            <div className="flex justify-between text-base"><dt>{t.total}</dt><dd>{formatMAD(Number(o.total), lang)}</dd></div>
            <div className="flex justify-between"><dt>{L("Paiement", "الدفع")}</dt><dd>{t.cod}</dd></div>
          </dl>
          <p className="mt-4 text-muted-foreground">{o.address}, {o.city}</p>
        </div>
      )}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/shop" className="btn-lux">{t.continueShopping}</Link>
        {n && <Link to="/track" search={{ n }} className="btn-ghost-lux">{L("Suivre", "تتبع")}</Link>}
        {s?.store.whatsapp && <a href={waLink(s.store.whatsapp, `Commande ${n ?? ""}`)} target="_blank" rel="noreferrer" className="btn-ghost-lux">WhatsApp</a>}
      </div>
    </div>
  );
}
