import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shippingFor, useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
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

function Checkout() {
  const { t } = useI18n();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    });
    setLoading(false);
    if (rpcErr) {
      const m = rpcErr.message.match(/out_of_stock:(.*)/);
      setError(m ? `${t.errOutOfStock} ${m[1]}` : t.errorGeneric);
      return;
    }
    const res = data as { order_number: string };
    clear();
    qc.invalidateQueries();
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
      <Summary subtotal={subtotal} shipping={shippingFor(subtotal)} />
    </div>
  );
}
