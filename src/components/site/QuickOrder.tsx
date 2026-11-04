import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMAD, useI18n } from "@/lib/i18n";
import { quickOrderSchema } from "@/lib/clothing";
import { syncNewOrders } from "@/lib/sheets.functions";

export function QuickOrder({ productId, price, freeShipping, size, color, disabled }: { productId: string; price: number; freeShipping: boolean; size: string; color: string; disabled: boolean }) {
  const { L, lang } = useI18n();
  const qc = useQueryClient();
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ order_number: string; total: number } | null>(null);
  const city = form.address.trim().split(",")[0]?.slice(0, 80) || form.address.trim().slice(0, 80);
  const quote = useQuery({ queryKey: ["quick-quote", price, city], enabled: price > 0, queryFn: async () => {
    const { data, error } = await supabase.rpc("quote_order", { _subtotal: price, _city: city, _coupon: "" });
    if (error) throw error;
    return data as { shipping: number };
  } });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || disabled || result) return;
    const parsed = quickOrderSchema.safeParse(form);
    if (!parsed.success) return setError(L(parsed.error.issues[0]?.message || "Vérifiez vos coordonnées.", "تحققوا من المعلومات."));
    busy.current = true; setLoading(true); setError("");
    try {
      const { data, error } = await supabase.rpc("place_order", { _customer_name: parsed.data.name, _phone: parsed.data.phone, _address: parsed.data.address, _city: city, _email: "", _notes: "", _coupon: "", _items: [{ product_id: productId, quantity: 1, size, color }] });
      if (error) throw error;
      setResult(data as { order_number: string; total: number });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["product"] });
      void syncNewOrders().catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String((err as { message?: string })?.message || "");
      setError(message.includes("out_of_stock") ? L("Cet article n’est plus disponible.", "المنتج غير متوفر.") : message.includes("invalid_size") || message.includes("invalid_color") ? L("Choisissez une taille et une couleur disponibles.", "اختاروا المقاس واللون.") : L("La commande n’a pas été enregistrée. Réessayez.", "لم يتم تسجيل الطلب. حاولوا مجدداً."));
    } finally { busy.current = false; setLoading(false); }
  };
  if (result) return <section className="mt-8 border-t border-primary pt-6" role="status"><h2 className="text-2xl">{L("Commande enregistrée", "تم تسجيل الطلب")}</h2><p className="mt-3">{result.order_number}</p><p>{formatMAD(result.total, lang)} · {L("Paiement à la livraison", "الدفع عند الاستلام")}</p></section>;
  return <form onSubmit={submit} className="mt-8 space-y-4 border-t border-border pt-6">
    <h2 className="text-2xl">{L("Commander", "اطلبوا الآن")}</h2>
    {([ ["name", L("Nom complet", "الاسم الكامل"), "text", "name", 100], ["phone", L("Numéro de téléphone", "رقم الهاتف"), "tel", "tel", 20], ["address", L("Adresse complète", "العنوان الكامل"), "text", "street-address", 300] ] as const).map(([key,label,type,autocomplete,max]) => <label key={key} className="block"><span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span><input className="field-checkout" type={type} autoComplete={autocomplete} maxLength={max} required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} /></label>)}
    {quote.data && <div className="flex justify-between text-sm"><span>{L("Livraison", "التوصيل")}</span><span>{formatMAD(freeShipping ? 0 : quote.data.shipping, lang)}</span></div>}
    {quote.data && <div className="flex justify-between font-medium"><span>Total</span><span>{formatMAD(price + (freeShipping ? 0 : quote.data.shipping), lang)}</span></div>}
    <p className="text-xs text-muted-foreground">{L("Paiement à la livraison", "الدفع عند الاستلام")}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button type="submit" disabled={disabled || loading} className="h-12 w-full rounded-[10px] bg-cta text-sm font-semibold uppercase tracking-[0.18em] text-street-black transition-all duration-200 hover:bg-cta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50 disabled:cursor-not-allowed disabled:opacity-40">{loading ? L("Enregistrement…", "جاري التسجيل…") : L("COMMANDER", "تأكيد الطلب")}</button>
  </form>;
}