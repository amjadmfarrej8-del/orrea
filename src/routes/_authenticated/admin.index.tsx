import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD } from "@/lib/i18n";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [orders, products, customers] = await Promise.all([
        supabase.from("orders").select("id, order_number, customer_name, total, status, created_at, city").order("created_at", { ascending: false }).limit(500),
        supabase.from("products").select("id, name_fr, stock, low_stock_threshold, is_active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { orders: orders.data ?? [], products: products.data ?? [], customers: customers.count ?? 0 };
    },
  });
  if (!data) return <p className="text-muted-foreground">Chargement…</p>;
  const valid = data.orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
  const today = new Date().toDateString();
  const todayOrders = data.orders.filter((o) => new Date(o.created_at).toDateString() === today).length;
  const pending = data.orders.filter((o) => o.status === "new").length;
  const low = data.products.filter((p) => p.stock <= p.low_stock_threshold);
  const stats = [
    ["Chiffre d'affaires livré", formatMAD(revenue, "fr")],
    ["Commandes aujourd'hui", String(todayOrders)],
    ["Nouvelles à traiter", String(pending)],
    ["Clients inscrits", String(data.customers)],
    ["Panier moyen", formatMAD(valid.length ? valid.reduce((s, o) => s + Number(o.total), 0) / valid.length : 0, "fr")],
    ["Produits actifs", String(data.products.filter((p) => p.is_active).length)],
  ];
  return (
    <div>
      <PageTitle title="Vue d'ensemble" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([k, v]) => (
          <Card key={k}><p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{k}</p><p className="mt-3 text-2xl font-semibold md:text-3xl">{v}</p></Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-4 flex justify-between"><p className="eyebrow">Dernières commandes</p><Link to="/admin/orders" className="text-xs link-lux">Tout voir</Link></div>
          <ul className="divide-y divide-border text-sm">
            {data.orders.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate">{o.order_number} · {o.customer_name}</span>
                <StatusBadge status={o.status} />
                <span>{formatMAD(Number(o.total), "fr")}</span>
              </li>
            ))}
            {data.orders.length === 0 && <li className="py-3 text-muted-foreground">Aucune commande.</li>}
          </ul>
        </Card>
        <Card>
          <p className="eyebrow mb-4">Stock faible</p>
          <ul className="divide-y divide-border text-sm">
            {low.map((p) => (
              <li key={p.id} className="flex justify-between py-3"><Link to="/admin/products/$id" params={{ id: p.id }} className="link-lux">{p.name_fr}</Link><span className={p.stock === 0 ? "text-destructive" : ""}>{p.stock}</span></li>
            ))}
            {low.length === 0 && <li className="py-3 text-muted-foreground">Tout est en stock.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
