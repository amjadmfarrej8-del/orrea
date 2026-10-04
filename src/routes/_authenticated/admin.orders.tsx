import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD } from "@/lib/i18n";
import { ORDER_STATUSES, statusText } from "@/lib/orders";
import { waLink } from "@/lib/settings";
import { productImage } from "@/lib/catalog";
import { Card, Input, PageTitle, StatusBadge } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: Orders });

function Orders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(1000)).data ?? [],
  });
  const productIds = [...new Set(data.flatMap((o) => o.order_items.map((i: any) => i.product_id)).filter(Boolean))];
  const { data: images = {} } = useQuery({
    queryKey: ["admin-order-images", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data: rows } = await supabase.from("products").select("id, image").in("id", productIds);
      return Object.fromEntries((rows ?? []).map((p) => [p.id, productImage(p.image)])) as Record<string, string>;
    },
  });
  const list = data.filter((o) => (!status || o.status === status) && (!q || `${o.order_number} ${o.customer_name} ${o.phone} ${o.city}`.toLowerCase().includes(q.toLowerCase())));

  const setOrderStatus = async (id: string, s: string) => {
    const { error } = await supabase.from("orders").update({ status: s }).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success("Statut mis à jour");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const exportCsv = () => {
    const rows = [["Numéro", "Date", "Client", "Téléphone", "Ville", "Adresse", "Total", "Statut"], ...list.map((o) => [o.order_number, o.created_at, o.customer_name, o.phone, o.city, o.address, o.total, o.status])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "commandes-theraven.csv";
    a.click();
  };

  return (
    <div>
      <PageTitle title="Commandes"><button onClick={exportCsv} className="btn-ghost-lux !px-4 !py-2">Exporter CSV</button></PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <Input placeholder="Rechercher (numéro, nom, téléphone…)" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-input bg-background px-3 text-sm">
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusText(s, "fr")}</option>)}
        </select>
      </div>
      <Card className="!p-0">
        <ul className="divide-y divide-border">
          {list.map((o) => (
            <li key={o.id}>
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 text-start text-sm md:grid-cols-[150px_1fr_120px_110px_100px]">
                <span className="tracking-[0.08em]">{o.order_number}</span>
                <span className="hidden min-w-0 truncate md:block">{o.customer_name} · {o.city}</span>
                <span className="hidden text-muted-foreground md:block">{new Date(o.created_at).toLocaleDateString("fr-FR")}</span>
                <StatusBadge status={o.status} />
                <span className="hidden text-end md:block">{formatMAD(Number(o.total), "fr")}</span>
              </button>
              {open === o.id && (
                <div className="grid gap-6 bg-card px-5 py-6 text-sm md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="eyebrow mb-2">Client</p>
                    <p>{o.customer_name}</p>
                    <p><a href={`tel:${o.phone}`} className="link-lux">{o.phone}</a> · <a href={waLink(o.phone.startsWith("0") ? "212" + o.phone.slice(1) : o.phone, `Bonjour ${o.customer_name}, THÉRAVÈNE concernant votre commande ${o.order_number}.`)} target="_blank" rel="noreferrer" className="link-lux">WhatsApp</a></p>
                    {o.email && <p>{o.email}</p>}
                    <p>{o.address}, {o.city}</p>
                    {o.notes && <p className="italic text-muted-foreground">« {o.notes} »</p>}
                  </div>
                  <div>
                    <p className="eyebrow mb-2">Articles</p>
                    <ul className="space-y-1">
                      {o.order_items.map((i: any) => {
                        const img = i.product_id ? images[i.product_id] : undefined;
                        const isComponent = Number(i.unit_price) === 0;
                        return (
                          <li key={i.id} className="flex items-center gap-3">
                            {img ? (
                              <img src={img} alt={i.product_name} className={`shrink-0 border border-border bg-background object-contain ${isComponent ? "h-7 w-7 opacity-70" : "h-11 w-11"}`} />
                            ) : (
                              <span className={`shrink-0 border border-border bg-muted ${isComponent ? "h-7 w-7" : "h-11 w-11"}`} />
                            )}
                            <span className="min-w-0 flex-1 truncate">{i.product_name} × {i.quantity}</span>
                            <span>{formatMAD(Number(i.unit_price) * i.quantity, "fr")}</span>
                          </li>
                        );
                      })}
                      <li className="flex justify-between text-muted-foreground"><span>Livraison</span><span>{formatMAD(Number(o.shipping), "fr")}</span></li>
                      {Number(o.discount) > 0 && <li className="flex justify-between text-muted-foreground"><span>Remise {o.coupon_code}</span><span>−{formatMAD(Number(o.discount), "fr")}</span></li>}
                      <li className="flex justify-between border-t border-border pt-2"><span>Total (paiement à la livraison)</span><span>{formatMAD(Number(o.total), "fr")}</span></li>
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {ORDER_STATUSES.map((s) => (
                        <button key={s} onClick={() => setOrderStatus(o.id, s)} className={`border px-3 py-1.5 text-xs ${o.status === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
                          {statusText(s, "fr")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
          {list.length === 0 && <li className="px-5 py-8 text-sm text-muted-foreground">Aucune commande.</li>}
        </ul>
      </Card>
    </div>
  );
}
