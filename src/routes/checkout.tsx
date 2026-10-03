import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Summary } from "./cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Commande — THÉRAVÉN" },
      { name: "description", content: "Finalisez votre commande THÉRAVÉN, paiement à la livraison." },
      { property: "og:title", content: "Commande — THÉRAVÉN" },
      { property: "og:description", content: "Paiement à la livraison partout au Maroc." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[+0-9 ]{8,20}$/),
  email: z.string().trim().max(255).email().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(500),
});

type Quote = { shipping: number; discount: number; coupon?: string; error?: string };

function Checkout() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", address: "", notes: "" });
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm((f) => ({ ...f, name: f.name || data.full_name, phone: f.phone || data.phone, email: f.email || data.email, city: f.city || data.city, address: f.address || data.address }));
    });
  }, [user]);

  const quote = useQuery({
    queryKey: ["quote", subtotal, form.city.trim().toLowerCase(), applied],
    queryFn: async () => {
      const { data } = await supabase.rpc("quote_order", { _subtotal: subtotal, _city: form.city, _coupon: applied || null as unknown as string });
      return data as Quote;
    },
  });
  const freeShip = items.some((i) => i.free_shipping);
  const q = quote.data && freeShip ? { ...quote.data, shipping: 0 } : quote.data;

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <p className="text-muted-foreground">{t.emptyCart}</p>
        <Link to="/shop" className="btn-lux mt-8">{t.continueShopping}</Link>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], true])));
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error: rpcErr } = await supabase.rpc("place_order", {
      _customer_name: r.data.name, _phone: r.data.phone, _email: r.data.email || null as unknown as string,
      _city: r.data.city, _address: r.data.address, _notes: r.data.notes || null as unknown as string,
      _items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      _coupon: q?.coupon || null as unknown as string,
    });
    setLoading(false);
    if (rpcErr) {
      const m = rpcErr.message.match(/out_of_stock:(.*)/);
      setError(m ? `${t.errOutOfStock} ${m[1]}` : rpcErr.message.includes("invalid_coupon") ? L("Code promo invalide.", "رمز الخصم غير صالح.") : t.errorGeneric);
      return;
    }
    const res = data as { order_number: string; total: number };
    sessionStorage.setItem("th-last-order", JSON.stringify({
      number: res.order_number, total: res.total, name: r.data.name, city: r.data.city, address: r.data.address,
      shipping: q?.shipping ?? 0, discount: q?.discount ?? 0,
      items: items.map((i) => ({ name: i.name_fr, name_ar: i.name_ar, qty: i.quantity, price: i.price })),
    }));
    clear();
    qc.invalidateQueries({ queryKey: ["products"] });
    navigate({ to: "/merci", search: { n: res.order_number } });
  };

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <label className="block">
      <span className={`eyebrow ${errors[k] ? "!text-destructive" : ""}`}>{label}</span>
      <input type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="field-lux" />
    </label>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-5 pt-16 md:grid-cols-[1fr_340px] md:px-10">
      <form onSubmit={submit} className="space-y-8">
        <h1 className="text-5xl">{t.checkoutTitle}</h1>
        {!user && <p className="text-sm text-muted-foreground">{L("Déjà cliente ?", "لديك حساب؟")} <Link to="/login" search={{ redirect: "/checkout" }} className="link-lux text-foreground">{L("Connectez-vous", "سجلي الدخول")}</Link></p>}
        {field("name", t.fullName)}
        <div className="grid gap-8 sm:grid-cols-2">
          {field("phone", t.phone, "tel")}
          {field("email", t.email, "email")}
        </div>
        {field("city", t.city)}
        {field("address", t.address)}
        {field("notes", t.notes)}
        <div className="border border-foreground p-5">
          <p className="text-sm font-normal">● {t.cod}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.codText}</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="btn-lux w-full">{loading ? t.placing : t.placeOrder}</button>
      </form>
      <Summary subtotal={subtotal} shipping={q?.shipping ?? 0} discount={q?.discount ?? 0}>
        <div className="mt-6 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.slice(0, 30))} placeholder={L("Code promo", "رمز الخصم")} className="field-lux flex-1 !py-2 text-sm uppercase" />
          <button type="button" onClick={() => setApplied(coupon.trim())} className="text-xs tracking-[0.2em] uppercase link-lux">{L("Appliquer", "تطبيق")}</button>
        </div>
        {applied && q?.error && <p className="mt-2 text-xs text-destructive">{L("Code promo invalide.", "رمز الخصم غير صالح.")}</p>}
        {q?.coupon && <p className="mt-2 text-xs">✓ {q.coupon}</p>}
      </Summary>
    </div>
  );
}
