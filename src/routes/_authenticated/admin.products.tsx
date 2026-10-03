import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/catalog";
import { formatMAD } from "@/lib/i18n";
import { Card, Input, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsLayout });

function ProductsLayout() {
  const match = useMatchRoute();
  if (match({ to: "/admin/products/$id" })) return <Outlet />;
  return <Products />;
}

function Products() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*, categories(name_fr)").order("created_at", { ascending: false })).data ?? [],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };
  const update = async (id: string, patch: { stock?: number; is_active?: boolean }) => {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };
  const list = data.filter((p) => !q || `${p.name_fr} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageTitle title="Produits & stock">
        <Link to="/admin/products/$id" params={{ id: "new" }} className="btn-lux !px-5 !py-2.5">Nouveau produit</Link>
      </PageTitle>
      <Input placeholder="Rechercher par nom ou SKU" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6 max-w-xs" />
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-start text-xs text-muted-foreground">
            <tr><th className="p-4 text-start">Produit</th><th className="p-4 text-start">SKU</th><th className="p-4 text-start">Catégorie</th><th className="p-4 text-start">Prix</th><th className="p-4 text-start">Stock</th><th className="p-4 text-start">En ligne</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="p-4">
                  <Link to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-3">
                    {p.image && <img src={productImage(p.image)} alt="" className="h-12 w-10 object-cover" />}
                    <span className="link-lux">{p.name_fr}</span>
                  </Link>
                </td>
                <td className="p-4 text-muted-foreground">{p.sku}</td>
                <td className="p-4">{p.categories?.name_fr}</td>
                <td className="p-4">{formatMAD(Number(p.price), "fr")}</td>
                <td className="p-4">
                  <input
                    type="number"
                    min={0}
                    defaultValue={p.stock}
                    onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value) || 0); if (v !== p.stock) update(p.id, { stock: v }); }}
                    className={`w-20 border bg-background px-2 py-1 ${p.stock <= p.low_stock_threshold ? "border-destructive text-destructive" : "border-input"}`}
                  />
                </td>
                <td className="p-4"><input type="checkbox" checked={p.is_active} onChange={(e) => update(p.id, { is_active: e.target.checked })} className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">Le stock se met à jour en quittant le champ. Les stocks faibles sont signalés en rouge.</p>
    </div>
  );
}
