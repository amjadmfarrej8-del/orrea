import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useI18n } from "@/lib/i18n";
import { settingsQuery, waLink } from "@/lib/settings";
import { InfoPage } from "@/components/site/InfoPage";
import { Field } from "@/components/site/AuthShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — THÉRAVÉN" },
      { name: "description", content: "Contactez THÉRAVÉN par WhatsApp, téléphone ou e-mail." },
      { property: "og:title", content: "Contact — THÉRAVÉN" },
      { property: "og:description", content: "Notre équipe vous répond." },
    ],
  }),
  component: Contact,
});

const schema = z.object({ name: z.string().trim().min(2).max(100), message: z.string().trim().min(5).max(1000) });

function Contact() {
  const { L, lang } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const [f, setF] = useState({ name: "", message: "" });
  const [err, setErr] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success || !s?.store.whatsapp) return setErr(L("Veuillez remplir le formulaire.", "يرجى ملء النموذج."));
    window.open(waLink(s.store.whatsapp, `${r.data.name} : ${r.data.message}`), "_blank", "noopener");
  };
  return (
    <InfoPage eyebrow="THÉRAVÉN" title={L("Nous contacter", "اتصلي بنا")}>
      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-4 text-foreground">
          {s?.store.phone && <p><span className="eyebrow block">{L("Téléphone", "الهاتف")}</span><a href={`tel:${s.store.phone.replace(/\s/g, "")}`}>{s.store.phone}</a></p>}
          {s?.store.email && <p><span className="eyebrow block">E-mail</span><a href={`mailto:${s.store.email}`}>{s.store.email}</a></p>}
          {s && <p><span className="eyebrow block">{L("Adresse", "العنوان")}</span>{lang === "ar" ? s.store.address_ar : s.store.address_fr}</p>}
          {s?.store.whatsapp && <a className="btn-lux" href={waLink(s.store.whatsapp, "Bonjour THÉRAVÉN")} target="_blank" rel="noreferrer">WhatsApp</a>}
        </div>
        <form onSubmit={send} className="space-y-7">
          <Field label={L("Nom", "الاسم")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <label className="block">
            <span className="eyebrow">{L("Message", "الرسالة")}</span>
            <textarea rows={4} maxLength={1000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="field-lux resize-none" />
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button className="btn-ghost-lux w-full">{L("Envoyer via WhatsApp", "إرسال عبر واتساب")}</button>
        </form>
      </div>
    </InfoPage>
  );
}
