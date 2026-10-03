import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { statusText } from "@/lib/orders";
import { Field } from "@/components/site/AuthShell";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Mon compte — THÉRAVÉN" },
      { name: "description", content: "Votre profil et vos commandes THÉRAVÉN." },
      { property: "og:title", content: "Mon compte — THÉRAVÉN" },
      { property: "og:description", content: "Profil et commandes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { L, lang } = useI18n();
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [p, setP] = useState({ full_name: "", phone: "", city: "", address: "" });

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  useEffect(() => {
    if (profile.data) setP({ full_name: profile.data.full_name, phone: profile.data.phone, city: profile.data.city, address: profile.data.address });
  }, [profile.data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: user!.id, email: user!.email ?? "", ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.slice(0, 300)])) });
    if (error) toast.error(error.message);
    else toast.success(L("Profil enregistré", "تم حفظ الملف"));
  };

  const logout = async () => {
    await qc.cancelQueries();
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pt-16 md:px-10">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-5xl">{L("Mon compte", "حسابي")}</h1>
        <button onClick={logout} className="link-lux text-xs tracking-[0.2em] uppercase">{L("Déconnexion", "تسجيل الخروج")}</button>
      </div>
      <div className="mt-14 grid gap-16 md:grid-cols-[1fr_1.4fr]">
        <form onSubmit={save} className="space-y-7">
          <p className="eyebrow">{L("Profil", "الملف الشخصي")} · {user?.email}</p>
          <Field label={L("Nom complet", "الاسم الكامل")} value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
          <Field label={L("Téléphone", "الهاتف")} value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          <Field label={L("Ville", "المدينة")} value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} />
          <Field label={L("Adresse", "العنوان")} value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} />
          <button className="btn-lux">{L("Enregistrer", "حفظ")}</button>
        </form>
        <div>
          <p className="eyebrow">{L("Mes commandes", "طلباتي")}</p>
          {orders.data?.length === 0 && <p className="mt-6 text-muted-foreground">{L("Aucune commande pour le moment.", "لا توجد طلبات بعد.")}</p>}
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {orders.data?.map((o) => (
              <li key={o.id} className="py-5">
                <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-center justify-between gap-4 text-start">
                  <div>
                    <div className="tracking-[0.12em]">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR")}</div>
                  </div>
                  <span className="bg-secondary px-3 py-1 text-[0.65rem] tracking-[0.15em] uppercase">{statusText(o.status, lang)}</span>
                  <span className="text-sm">{formatMAD(Number(o.total), lang)}</span>
                </button>
                {open === o.id && (
                  <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                    {o.order_items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{formatMAD(Number(i.unit_price) * i.quantity, lang)}</span></li>)}
                    <li className="flex justify-between pt-2"><span>{L("Livraison", "التوصيل")}</span><span>{formatMAD(Number(o.shipping), lang)}</span></li>
                    {Number(o.discount) > 0 && <li className="flex justify-between"><span>{L("Remise", "الخصم")}</span><span>−{formatMAD(Number(o.discount), lang)}</span></li>}
                    <li className="pt-2">{o.address}, {o.city}</li>
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
