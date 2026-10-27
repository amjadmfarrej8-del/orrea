import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD } from "@/lib/i18n";
import { Card, Input, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/customers")({ head: () => ({ meta: [{ title: "Clients — Administration THÉRAVÈNE" }, { name: "description", content: "Administration THÉRAVÈNE : clients." }, { property: "og:title", content: "Clients — Administration THÉRAVÈNE" }, { property: "og:description", content: "Administration THÉRAVÈNE : clients." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Customers });

type Row = { key: string; name: string; phone: string; email: string; city: string; orders: number; spent: number; last: string; registered: boolean };

function Customers() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [orders, profiles] = await Promise.all([
        supabase.from("orders").select("customer_name, phone, email, city, total, status, created_at, user_id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);
      const map = new Map<string, Row>();
      for (const p of profiles.data ?? []) map.set("u:" + p.id, { key: "u:" + p.id, name: p.full_name, phone: p.phone, email: p.email, city: p.city, orders: 0, spent: 0, last: "", registered: true });
      for (const o of orders.data ?? []) {
        const k = o.user_id ? "u:" + o.user_id : "p:" + o.phone.replace(/\D/g, "");
        const r = map.get(k) ?? { key: k, name: o.customer_name, phone: o.phone, email: o.email ?? "", city: o.city, orders: 0, spent: 0, last: "", registered: false };
        r.orders++;
        if (o.status !== "cancelled") r.spent += Number(o.total);
        if (!r.last) r.last = o.created_at;
        if (!r.name) r.name = o.customer_name;
        if (!r.phone) r.phone = o.phone;
        map.set(k, r);
      }
      return [...map.values()].sort((a, b) => b.spent - a.spent);
    },
  });
  const list = data.filter((r) => !q || `${r.name} ${r.phone} ${r.email} ${r.city}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageTitle title="Clients" />
      <Input placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6 max-w-xs" />
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="p-4 text-start">Nom</th><th className="p-4 text-start">Contact</th><th className="p-4 text-start">Ville</th><th className="p-4 text-start">Commandes</th><th className="p-4 text-start">Dépensé</th><th className="p-4 text-start">Compte</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((r) => (
              <tr key={r.key}>
                <td className="p-4">{r.name || "—"}</td>
                <td className="p-4 text-muted-foreground">{r.phone}<br />{r.email}</td>
                <td className="p-4">{r.city}</td>
                <td className="p-4">{r.orders}</td>
                <td className="p-4">{formatMAD(r.spent, "fr")}</td>
                <td className="p-4 text-xs">{r.registered ? "Inscrite" : "Invitée"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
