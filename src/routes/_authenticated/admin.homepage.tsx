import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SECTION_TYPES, saveSetting, settingsQuery, type Section } from "@/lib/settings";
import { AField, Card, ImageUpload, Input, PageTitle, Textarea } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/homepage")({ component: HomepageBuilder });

const typeLabel: Record<string, string> = {
  hero: "Bannière principale", promo: "Bandeau promotionnel", benefits: "Avantages", categories: "Catégories", featured: "Produits sélectionnés",
  story: "Histoire de la marque", bestsellers: "Best-sellers", new: "Nouveautés", reviews: "Avis clientes", newsletter: "Newsletter & Instagram",
};
const hasText = new Set(["hero", "story", "newsletter"]);
const hasImage = new Set(["hero", "story"]);

function HomepageBuilder() {
  const qc = useQueryClient();
  const { data: s } = useQuery(settingsQuery);
  const products = useQuery({ queryKey: ["admin-products-lite"], queryFn: async () => (await supabase.from("products").select("id, name_fr").order("name_fr")).data ?? [] });
  const [secs, setSecs] = useState<Section[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [newType, setNewType] = useState<string>("promo");
  useEffect(() => { if (s) setSecs(s.homepage.sections); }, [s]);

  const upd = (id: string, patch: Partial<Section>) => setSecs((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setSecs((xs) => { const a = [...xs]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j]!, a[i]!]; return a; });
  const save = async () => {
    try {
      await saveSetting("homepage", { sections: secs });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Page d'accueil publiée");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div>
      <PageTitle title="Page d'accueil"><button onClick={save} className="btn-lux !px-6 !py-2.5">Publier</button></PageTitle>
      <div className="space-y-3">
        {secs.map((sec, i) => (
          <Card key={sec.id} className="!p-0">
            <div className="flex items-center gap-3 px-5 py-4">
              <button onClick={() => setOpen(open === sec.id ? null : sec.id)} className={`flex-1 text-start ${sec.visible ? "" : "text-muted-foreground line-through"}`}>
                <span className="text-sm">{typeLabel[sec.type] ?? sec.type}</span>
                {sec.title_fr && <span className="ms-3 text-xs text-muted-foreground">{sec.title_fr.slice(0, 50)}</span>}
              </button>
              <button onClick={() => move(i, -1)} aria-label="Monter"><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => move(i, 1)} aria-label="Descendre"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => upd(sec.id, { visible: !sec.visible })} aria-label="Visibilité">{sec.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
              <button onClick={() => confirm("Retirer cette section ?") && setSecs(secs.filter((x) => x.id !== sec.id))} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
            {open === sec.id && (
              <div className="grid gap-4 border-t border-border bg-card p-5 md:grid-cols-2">
                {sec.type !== "benefits" && (
                  <>
                    <AField label="Titre (FR)"><Input value={sec.title_fr ?? ""} onChange={(e) => upd(sec.id, { title_fr: e.target.value })} /></AField>
                    <AField label="Titre (AR)"><Input dir="rtl" value={sec.title_ar ?? ""} onChange={(e) => upd(sec.id, { title_ar: e.target.value })} /></AField>
                  </>
                )}
                {hasText.has(sec.type) && (
                  <>
                    <AField label="Texte (FR)"><Textarea value={sec.text_fr ?? ""} onChange={(e) => upd(sec.id, { text_fr: e.target.value })} /></AField>
                    <AField label="Texte (AR)"><Textarea dir="rtl" value={sec.text_ar ?? ""} onChange={(e) => upd(sec.id, { text_ar: e.target.value })} /></AField>
                  </>
                )}
                {sec.type === "hero" && (
                  <>
                    <AField label="Bouton (FR)"><Input value={sec.button_fr ?? ""} onChange={(e) => upd(sec.id, { button_fr: e.target.value })} /></AField>
                    <AField label="Bouton (AR)"><Input dir="rtl" value={sec.button_ar ?? ""} onChange={(e) => upd(sec.id, { button_ar: e.target.value })} /></AField>
                    <AField label="Lien du bouton (ex. /shop)"><Input value={sec.link ?? ""} onChange={(e) => upd(sec.id, { link: e.target.value })} /></AField>
                  </>
                )}
                {hasImage.has(sec.type) && <ImageUpload label="Image (vide = image par défaut)" value={sec.image ?? ""} onChange={(v) => upd(sec.id, { image: v })} />}
                {sec.type === "featured" && (
                  <div className="md:col-span-2">
                    <p className="eyebrow mb-2">Produits affichés (aucun = produits « mis en avant »)</p>
                    <div className="flex flex-wrap gap-2">
                      {products.data?.map((p) => {
                        const on = sec.product_ids?.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => upd(sec.id, { product_ids: on ? sec.product_ids!.filter((x) => x !== p.id) : [...(sec.product_ids ?? []), p.id] })}
                            className={`border px-3 py-1.5 text-xs ${on ? "border-foreground bg-foreground text-background" : "border-border"}`}>{p.name_fr}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
      <Card className="mt-6 flex flex-wrap items-center gap-3">
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="border border-input bg-background px-3 py-2 text-sm">
          {SECTION_TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
        </select>
        <button onClick={() => { const id = `${newType}-${Date.now()}`; setSecs([...secs, { id, type: newType, visible: true, title_fr: typeLabel[newType], title_ar: "" }]); setOpen(id); }} className="btn-ghost-lux !px-4 !py-2">Ajouter une section</button>
      </Card>
    </div>
  );
}
