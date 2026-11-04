import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { formatMAD, useI18n } from "@/lib/i18n";
import { fullAddress } from "@/lib/orders";
import { settingsQuery, waLink } from "@/lib/settings";

export const Route = createFileRoute("/merci")({
  validateSearch: z.object({ n: z.string().max(20).optional() }),
  staticData: { sitemap: false },
  head: () => pageHead({ path: "/merci", title: "Merci pour votre commande | ORRÉA", description: "Votre commande ORRÉA est confirmée.", noindex: true }),
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
      <p className="eyebrow text-center">ORRÉA</p>
      <h1 className="mt-5 text-center text-[2rem] leading-tight md:text-[2.9rem]">{t.thanksTitle}{o ? `, ${o.name.split(" ")[0]}` : ""}</h1>
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
          <p className="mt-4 text-muted-foreground">{fullAddress(o.city, o.address)}</p>
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
