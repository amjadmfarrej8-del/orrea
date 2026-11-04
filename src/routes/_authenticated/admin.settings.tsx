import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveSetting, settingsQuery, type Seo, type Store } from "@/lib/settings";
import { AField, Card, ImageUpload, Input, PageTitle, Textarea } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/settings")({ staticData: { sitemap: false }, head: () => ({ meta: [{ title: "Réglages de la boutique — Administration ORRÉA" }, { name: "description", content: "Administration ORRÉA : réglages de la boutique." }, { property: "og:title", content: "Réglages de la boutique — Administration ORRÉA" }, { property: "og:description", content: "Administration ORRÉA : réglages de la boutique." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Settings });

function Settings() {
  const qc = useQueryClient();
  const { data: s } = useQuery(settingsQuery);
  const [store, setStore] = useState<Store | null>(null);
  const [seo, setSeo] = useState<Seo | null>(null);
  useEffect(() => { if (s) { setStore(s.store); setSeo(s.seo); } }, [s]);
  if (!store || !seo) return null;

  const save = async () => {
    try {
      await saveSetting("store", { ...store, whatsapp: store.whatsapp.replace(/[^0-9]/g, "") });
      await saveSetting("seo", seo);
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Paramètres enregistrés");
    } catch (e) { toast.error((e as Error).message); }
  };
  const st = (k: keyof Store, label: string) => <AField label={label}><Input value={String(store[k])} onChange={(e) => setStore({ ...store, [k]: e.target.value })} /></AField>;

  return (
    <div>
      <PageTitle title="Boutique & SEO"><button onClick={save} className="btn-lux !px-6 !py-2.5">Enregistrer</button></PageTitle>
      <Card className="mb-6 grid gap-5 md:grid-cols-2">
        <p className="eyebrow md:col-span-2">Coordonnées & réseaux</p>
        {st("whatsapp", "Numéro WhatsApp (format international, ex. 212612345678)")}
        {st("phone", "Téléphone affiché")}
        {st("email", "E-mail")}
        {st("address_fr", "Adresse (FR)")}
        {st("address_ar", "Adresse (AR)")}
        {st("instagram", "Lien Instagram")}
        {st("facebook", "Lien Facebook")}
        {st("tiktok", "Lien TikTok")}
      </Card>
      <Card className="grid gap-5 md:grid-cols-2">
        <p className="eyebrow md:col-span-2">Référencement (page d'accueil)</p>
        <AField label="Titre (FR)"><Input maxLength={70} value={seo.title_fr} onChange={(e) => setSeo({ ...seo, title_fr: e.target.value })} /></AField>
        <AField label="Titre (AR)"><Input maxLength={70} value={seo.title_ar} onChange={(e) => setSeo({ ...seo, title_ar: e.target.value })} /></AField>
        <AField label="Description (FR)"><Textarea maxLength={160} value={seo.description_fr} onChange={(e) => setSeo({ ...seo, description_fr: e.target.value })} /></AField>
        <AField label="Description (AR)"><Textarea maxLength={160} value={seo.description_ar} onChange={(e) => setSeo({ ...seo, description_ar: e.target.value })} /></AField>
        <ImageUpload label="Image de partage (réseaux sociaux)" value={seo.og_image} onChange={(v) => setSeo({ ...seo, og_image: v })} />
      </Card>
    </div>
  );
}
