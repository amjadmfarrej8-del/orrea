import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { defaultSettings, saveSetting, settingsQuery, type Theme } from "@/lib/settings";
import { fontHref, themeCss } from "@/components/site/ThemeStyle";
import { AField, Card, ImageUpload, Input, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/theme")({ head: () => ({ meta: [{ title: "Apparence — Administration THÉRAVÈNE" }, { name: "description", content: "Administration THÉRAVÈNE : apparence." }, { property: "og:title", content: "Apparence — Administration THÉRAVÈNE" }, { property: "og:description", content: "Administration THÉRAVÈNE : apparence." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: ThemeEditor });

const colors: [keyof Theme, string][] = [
  ["background", "Fond"], ["foreground", "Texte"], ["primary", "Boutons / couleur principale"], ["primary_hover", "Survol des boutons"],
  ["secondary", "Couleur secondaire"], ["accent", "Accent"], ["champagne", "Accent (détails)"],
];
const fonts = ["Cormorant Garamond", "Playfair Display", "Bodoni Moda", "Italiana", "Jost", "Manrope", "Montserrat", "Lato", "DM Sans"];

function ThemeEditor() {
  const qc = useQueryClient();
  const { data: s } = useQuery(settingsQuery);
  const [t, setT] = useState<Theme | null>(null);
  useEffect(() => { if (s) setT(s.theme); }, [s]);
  if (!t) return null;

  const save = async () => {
    try {
      await saveSetting("theme", t);
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Thème appliqué au site");
    } catch (e) { toast.error((e as Error).message); }
  };
  const font = (k: "display_font" | "body_font", label: string) => (
    <AField label={label}>
      <select value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} className="w-full border border-input bg-background px-3 py-2 text-sm">
        {fonts.map((f) => <option key={f}>{f}</option>)}
      </select>
    </AField>
  );

  return (
    <div>
      <PageTitle title="Thème">
        <button onClick={() => setT({ ...defaultSettings.theme, logo_url: t.logo_url, favicon_url: t.favicon_url })} className="text-xs link-lux">Réinitialiser</button>
        <button onClick={save} className="btn-lux !px-6 !py-2.5">Publier</button>
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Card className="grid grid-cols-2 gap-4">
            {colors.map(([k, label]) => (
              <AField key={k} label={label}>
                <div className="flex gap-2">
                  <input type="color" value={String(t[k])} onChange={(e) => setT({ ...t, [k]: e.target.value })} className="h-9 w-10 cursor-pointer border border-input" />
                  <Input value={String(t[k])} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
                </div>
              </AField>
            ))}
          </Card>
          <Card className="grid gap-4 md:grid-cols-2">
            {font("display_font", "Police des titres")}
            {font("body_font", "Police du texte")}
            <AField label={`Arrondi des angles : ${t.radius}px`}>
              <input type="range" min={0} max={24} value={t.radius} onChange={(e) => setT({ ...t, radius: Number(e.target.value) })} className="w-full" />
            </AField>
          </Card>
          <Card className="space-y-5">
            <ImageUpload label="Logo (remplace le texte THÉRAVÈNE)" value={t.logo_url} onChange={(v) => setT({ ...t, logo_url: v })} />
            <ImageUpload label="Favicon" value={t.favicon_url} onChange={(v) => setT({ ...t, favicon_url: v })} />
          </Card>
        </div>
        <Card className="sticky top-6 h-fit !p-0 overflow-hidden">
          <p className="eyebrow border-b border-border px-5 py-3">Aperçu en direct</p>
          <Preview t={t} />
        </Card>
      </div>
    </div>
  );
}

function Preview({ t }: { t: Theme }) {
  const css = themeCss(t).replace(":root", ".theme-preview");
  return (
    <div className="theme-preview bg-background p-8 text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      <link rel="stylesheet" href={fontHref(t)} />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="text-[0.76rem] tracking-[0.12em] uppercase">Boutique</span>
        {t.logo_url ? <img src={t.logo_url} alt="" className="h-7" /> : <span className="text-xl tracking-[0.16em]" style={{ fontFamily: "var(--font-display)" }}>THÉRAVÈNE</span>}
        <span className="text-[0.76rem] tracking-[0.12em] uppercase">Panier</span>
      </div>
      <p className="eyebrow mt-10">Collection 2026</p>
      <h2 className="mt-3 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>L’allure, simplement.</h2>
      <p className="mt-3 text-sm text-muted-foreground">Mode Femme & Homme.</p>
      <div className="mt-6 flex gap-3">
        <span className="btn-lux" style={{ borderRadius: "var(--radius)" }}>Découvrir</span>
        <span className="btn-ghost-lux" style={{ borderRadius: "var(--radius)" }}>En savoir plus</span>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="aspect-[4/5] bg-secondary" style={{ borderRadius: "var(--radius)" }} />
            <p className="mt-2" style={{ fontFamily: "var(--font-display)" }}>Article</p>
            <p className="text-xs text-champagne">Prix réel du catalogue</p>
          </div>
        ))}
      </div>
    </div>
  );
}
