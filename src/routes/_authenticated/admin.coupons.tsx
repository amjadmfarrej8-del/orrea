import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AField, Card, Input, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/coupons")({ staticData: { sitemap: false }, head: () => ({ meta: [{ title: "Codes promo — Administration ORRÉA" }, { name: "description", content: "Administration ORRÉA : codes promo." }, { property: "og:title", content: "Codes promo — Administration ORRÉA" }, { property: "og:description", content: "Administration ORRÉA : codes promo." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Coupons });

function Coupons() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-coupons"], queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ code: "", kind: "percent", value: 10, min_subtotal: 0, expires_at: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!code || f.value <= 0) return void toast.error("Code et valeur requis");
    const { error } = await supabase.from("coupons").insert({ code, kind: f.kind, value: f.value, min_subtotal: f.min_subtotal, expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null });
    if (error) return void toast.error(error.message.includes("duplicate") ? "Ce code existe déjà" : error.message);
    setF({ ...f, code: "" });
    refresh();
  };

  return (
    <div>
      <PageTitle title="Codes promo" />
      <Card className="mb-6">
        <form onSubmit={add} className="grid items-end gap-4 md:grid-cols-6">
          <AField label="Code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></AField>
          <AField label="Type">
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="w-full border border-input bg-background px-3 py-2 text-sm">
              <option value="percent">Pourcentage</option><option value="fixed">Montant (MAD)</option>
            </select>
          </AField>
          <AField label="Valeur"><Input type="number" min={1} value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></AField>
          <AField label="Minimum (MAD)"><Input type="number" min={0} value={f.min_subtotal} onChange={(e) => setF({ ...f, min_subtotal: Number(e.target.value) })} /></AField>
          <AField label="Expire le"><Input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></AField>
          <button className="btn-lux !py-2.5">Ajouter</button>
        </form>
      </Card>
      <Card className="!p-0">
        <ul className="divide-y divide-border text-sm">
          {data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <span className="tracking-[0.15em]">{c.code}</span>
              <span>{c.kind === "percent" ? `−${c.value}%` : `−${c.value} MAD`}{Number(c.min_subtotal) > 0 && ` dès ${c.min_subtotal} MAD`}</span>
              <span className="text-muted-foreground">{c.expires_at ? `Expire ${new Date(c.expires_at).toLocaleDateString("fr-FR")}` : "Sans expiration"}</span>
              <label className="flex items-center gap-2"><input type="checkbox" checked={c.is_active} onChange={async (e) => { await supabase.from("coupons").update({ is_active: e.target.checked }).eq("id", c.id); refresh(); }} />Actif</label>
              <button onClick={async () => { if (confirm("Supprimer ?")) { await supabase.from("coupons").delete().eq("id", c.id); refresh(); } }} className="text-xs text-destructive">Supprimer</button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
