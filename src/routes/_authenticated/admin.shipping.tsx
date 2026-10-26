import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveSetting, settingsQuery } from "@/lib/settings";
import { AField, Card, Input, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/shipping")({ component: Shipping });

function Shipping() {
  const qc = useQueryClient();
  const { data: s } = useQuery(settingsQuery);
  const zones = useQuery({ queryKey: ["zones"], queryFn: async () => (await supabase.from("shipping_zones").select("*").order("city")).data ?? [] });
  const [fee, setFee] = useState(20);
  const [free, setFree] = useState(500);
  const [city, setCity] = useState("");
  const [zfee, setZfee] = useState(0);
  useEffect(() => { if (s) { setFee(s.store.shipping_fee); setFree(s.store.free_shipping_threshold); } }, [s]);

  const saveDefaults = async () => {
    if (!s) return;
    try {
      await saveSetting("store", { ...s.store, shipping_fee: Math.max(0, fee), free_shipping_threshold: Math.max(0, free) });
      toast.success("Tarifs enregistrés");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e) { toast.error((e as Error).message); }
  };
  const addZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    const { error } = await supabase.from("shipping_zones").upsert({ city: city.trim().slice(0, 80), fee: Math.max(0, zfee) }, { onConflict: "city" });
    if (error) return void toast.error(error.message);
    setCity("");
    zones.refetch();
  };

  return (
    <div>
      <PageTitle title="Livraison" />
      <Card className="mb-6 grid items-end gap-4 md:grid-cols-3">
        <AField label="Frais par défaut (MAD)"><Input type="number" min={0} value={fee} onChange={(e) => setFee(Number(e.target.value))} /></AField>
        <AField label="Livraison offerte dès (MAD)"><Input type="number" min={0} value={free} onChange={(e) => setFree(Number(e.target.value))} /></AField>
        <button onClick={saveDefaults} className="btn-lux !py-2.5">Enregistrer</button>
      </Card>
      <Card>
        <p className="eyebrow mb-4">Tarifs par ville (remplacent le tarif par défaut)</p>
        <form onSubmit={addZone} className="mb-6 flex flex-wrap gap-3">
          <Input placeholder="Ville (ex. Dakhla)" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-xs" />
          <Input type="number" min={0} placeholder="Frais" value={zfee} onChange={(e) => setZfee(Number(e.target.value))} className="max-w-[120px]" />
          <button className="btn-ghost-lux !px-4 !py-2">Ajouter / modifier</button>
        </form>
        <ul className="divide-y divide-border text-sm">
          {zones.data?.map((z) => (
            <li key={z.id} className="flex items-center justify-between py-3">
              <span>{z.city}</span>
              <span className="flex items-center gap-6">{z.fee} MAD
                <button onClick={async () => { await supabase.from("shipping_zones").delete().eq("id", z.id); zones.refetch(); }} className="text-xs text-destructive">Supprimer</button>
              </span>
            </li>
          ))}
          {zones.data?.length === 0 && <li className="py-3 text-muted-foreground">Aucune ville spécifique : le tarif par défaut s'applique partout.</li>}
        </ul>
      </Card>
    </div>
  );
}
