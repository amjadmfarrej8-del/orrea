import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD, useI18n } from "@/lib/i18n";
import { ORDER_STATUSES, statusText } from "@/lib/orders";
import { Field } from "@/components/site/AuthShell";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ n: z.string().max(20).optional() }),
  head: () => ({
    meta: [
      { title: "Suivi de commande — THÉRAVÉN" },
      { name: "description", content: "Suivez votre commande THÉRAVÉN avec votre numéro et votre téléphone." },
      { property: "og:title", content: "Suivi de commande — THÉRAVÉN" },
      { property: "og:description", content: "Où en est votre commande ?" },
    ],
  }),
  component: Track,
});

type Res = { order_number: string; status: string; total: number; shipping: number; discount: number; city: string; items: { name: string; qty: number; price: number }[] } | null;

function Track() {
  const { L, lang } = useI18n();
  const { n } = Route.useSearch();
  const [num, setNum] = useState(n ?? "");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<Res | undefined>();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.rpc("track_order", { _number: num.slice(0, 20), _phone: phone.slice(0, 20) });
    setRes((data as Res) ?? null);
  };
  const idx = res ? ORDER_STATUSES.indexOf(res.status as never) : -1;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-16">
      <h1 className="text-5xl">{L("Suivre ma commande", "تتبع طلبي")}</h1>
      <form onSubmit={submit} className="mt-10 grid gap-7 sm:grid-cols-2">
        <Field label={L("Numéro de commande", "رقم الطلب")} required value={num} onChange={(e) => setNum(e.target.value)} placeholder="TH-XXXXXXXX" />
        <Field label={L("Téléphone", "الهاتف")} required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn-lux sm:col-span-2">{L("Rechercher", "بحث")}</button>
      </form>
      {res === null && <p className="mt-10 text-destructive">{L("Aucune commande trouvée.", "لم يتم العثور على أي طلب.")}</p>}
      {res && (
        <div className="mt-14 animate-rise">
          <p className="eyebrow">{res.order_number}</p>
          {res.status === "cancelled" ? (
            <p className="mt-4 text-2xl">{statusText("cancelled", lang)}</p>
          ) : (
            <ol className="mt-6 grid grid-cols-5 gap-1">
              {ORDER_STATUSES.slice(0, 5).map((s, i) => (
                <li key={s} className="text-center">
                  <div className={`h-0.5 ${i <= idx ? "bg-foreground" : "bg-border"}`} />
                  <p className={`mt-3 text-[0.8rem] tracking-[0.1em] uppercase ${i <= idx ? "" : "text-muted-foreground"}`}>{statusText(s, lang)}</p>
                </li>
              ))}
            </ol>
          )}
          <ul className="mt-10 space-y-2 border-t border-border pt-6 text-sm">
            {res.items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>{formatMAD(i.price * i.qty, lang)}</span></li>)}
            <li className="flex justify-between border-t border-border pt-3 text-base"><span>{L("Total", "المجموع")}</span><span>{formatMAD(Number(res.total), lang)}</span></li>
          </ul>
        </div>
      )}
    </div>
  );
}
