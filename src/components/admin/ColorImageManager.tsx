import { useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AField, Input } from "@/components/admin/ui";
import { productImage } from "@/lib/catalog";
import { uploadMedia } from "@/lib/settings";
import type { ClothingColor } from "@/lib/clothing";

function ColorEntry({ value, onChange, onRemove, onBusy }: { value: ClothingColor; onChange: (patch: Partial<ClothingColor>) => void; onRemove: () => void; onBusy: (busy: boolean) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3 border-b border-border py-4">
      <div className="flex items-start gap-3">
        <div className="h-24 w-20 shrink-0 overflow-hidden bg-studio">
          {value.image && <img src={productImage(value.image)} alt={value.name || "Photo couleur"} className="h-full w-full object-cover object-top" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => file.current?.click()}><Upload />{busy ? "Envoi…" : value.image ? "Changer la photo" : "Téléverser une image"}</Button>
          <Button type="button" variant="ghost" size="icon" disabled={busy} title="Supprimer cette couleur" aria-label={`Supprimer la couleur ${value.name || "sans nom"}`} onClick={onRemove}><Trash2 /></Button>
          <input ref={file} type="file" accept="image/*" aria-label={`Image de la couleur ${value.name || "sans nom"}`} className="hidden" disabled={busy} onChange={async (event) => {
            const image = event.target.files?.[0];
            event.target.value = "";
            if (!image) return;
            setBusy(true); onBusy(true);
            try { onChange({ image: await uploadMedia(image) }); }
            catch (error) { toast.error(error instanceof Error ? error.message : "Envoi impossible"); }
            finally { setBusy(false); onBusy(false); }
          }} />
        </div>
      </div>
      <AField label="Nom de la couleur"><Input value={value.name} maxLength={60} placeholder="Ex. Beige, Noir, Gris" onChange={e => onChange({ name: e.target.value })} /></AField>
      <AField label="HEX (facultatif)">
        <div className="flex items-center gap-2">
          <Input type="color" aria-label="Choisir la teinte HEX" value={/^#[0-9a-fA-F]{6}$/.test(value.hex ?? "") ? value.hex : "#000000"} onChange={e => onChange({ hex: e.target.value })} className="h-9 w-12! shrink-0 cursor-pointer p-1" />
          <Input value={value.hex ?? ""} aria-label="Code HEX" maxLength={7} placeholder="#000000" className="min-w-0 flex-1" onChange={e => onChange({ hex: e.target.value || undefined })} />
          {value.hex && <Button type="button" variant="ghost" size="icon" title="Retirer la teinte HEX" aria-label="Retirer la teinte HEX" onClick={() => onChange({ hex: undefined })}><X /></Button>}
        </div>
      </AField>
    </div>
  );
}

export function ColorImageManager({ value, onChange, onUploadingChange }: { value: ClothingColor[]; onChange: (update: (colors: ClothingColor[]) => ClothingColor[]) => void; onUploadingChange: (busy: boolean) => void }) {
  const ids = useRef(value.map((_, index) => `existing-${index}`));
  const uploads = useRef(new Set<string>());
  while (ids.current.length < value.length) ids.current.push(`existing-${ids.current.length}`);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow">Couleurs</span>
        <Button type="button" variant="outline" size="sm" onClick={() => { ids.current.push(crypto.randomUUID()); onChange(colors => [...colors, { name: "", image: "" }]); }}><Plus />Ajouter une couleur</Button>
      </div>
      {value.map((color, index) => {
        const id = ids.current[index] ?? `existing-${index}`;
        return <ColorEntry key={id} value={color} onBusy={busy => { if (busy) uploads.current.add(id); else uploads.current.delete(id); onUploadingChange(uploads.current.size > 0); }} onChange={patch => onChange(colors => colors.map((entry, i) => ids.current[i] === id ? { ...entry, ...patch } : entry))} onRemove={() => { const removed = ids.current.indexOf(id); ids.current.splice(removed, 1); onChange(colors => colors.filter((_, i) => i !== removed)); }} />;
      })}
    </div>
  );
}