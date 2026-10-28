import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/settings";
import { hasFreeShipping, shippingFor, useCart } from "@/lib/cart";
import { productImage } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";
import { PackCard } from "@/components/site/PackCard";
import { productsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Panier — ORRÉA" },
      { name: "description", content: "Votre panier ORRÉA." },
      { property: "og:title", content: "Panier — ORRÉA" },
      { property: "og:description", content: "Votre sélection ORRÉA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const { items, setQty, remove, subtotal } = useCart();
  const { data: st } = useQuery(settingsQuery);
  const { data: all } = useQuery(productsQuery);
  const itemIds = items.map((item) => item.id);
  const packIds = (all ?? []).filter((p) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0).map((p) => p.id);
  const showPack = (all ?? []).some((p) => packIds.includes(p.id) && !itemIds.includes(p.id) && (p.bundle_items as { product_id: string }[]).some((item) => itemIds.includes(item.product_id)));
  const shipping = hasFreeShipping(items) ? 0 : shippingFor(subtotal, st?.store.shipping_fee, st?.store.free_shipping_threshold);

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <h1 className="text-[2rem] leading-tight md:text-[2.9rem]">{t.cart}</h1>
        <p className="mt-6 text-muted-foreground">{t.emptyCart}</p>
        <Link to="/shop" className="btn-lux mt-10">{t.continueShopping}</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-5 pt-16 md:grid-cols-[1fr_340px] md:px-10">
      <div>
        <h1 className="text-[2rem] leading-tight md:text-[2.9rem]">{t.cart}</h1>
        <FreeBar subtotal={subtotal} free={hasFreeShipping(items) ? 0 : (st?.store.free_shipping_threshold ?? 500)} />
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {items.map((i) => (
            <li key={i.id} className="flex gap-5 py-6">
              <img src={productImage(i.image)} alt="" className="h-28 w-24 bg-card object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <Link to="/products/$slug" params={{ slug: i.slug }} className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
                    {lang === "ar" ? i.name_ar : i.name_fr}
                  </Link>
                  <span className="text-sm">{formatMAD(i.price * i.quantity, lang)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-border">
                    <button className="p-2.5" onClick={() => setQty(i.id, i.quantity - 1)} aria-label="-"><Minus className="h-3 w-3" /></button>
                    <span className="w-7 text-center text-sm">{i.quantity}</span>
                    <button className="p-2.5" onClick={() => setQty(i.id, i.quantity + 1)} aria-label="+"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => remove(i.id)} className="link-lux text-xs text-muted-foreground">{t.remove}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Summary subtotal={subtotal} shipping={shipping}>
        <Link to="/checkout" className="btn-lux mt-8 w-full">{t.checkout}</Link>
      </Summary>
      {showPack && <div className="md:col-span-2 -mx-5 md:-mx-10"><PackCard productIds={itemIds} excludeIds={itemIds} /></div>}
    </div>
  );
}

export function Summary({ subtotal, shipping, discount = 0, children }: { subtotal: number; shipping: number; discount?: number; children?: React.ReactNode }) {
  const { t, lang, L } = useI18n();
  const { data: st } = useQuery(settingsQuery);
  return (
    <aside className="h-fit bg-card p-8 md:mt-20">
      <p className="eyebrow">{t.summary}</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between"><dt>{t.subtotal}</dt><dd>{formatMAD(subtotal, lang)}</dd></div>
        <div className="flex justify-between"><dt>{t.shipping}</dt><dd>{shipping === 0 ? t.free : formatMAD(shipping, lang)}</dd></div>
        {discount > 0 && <div className="flex justify-between"><dt>{L("Remise", "الخصم")}</dt><dd>−{formatMAD(discount, lang)}</dd></div>}
        <div className="flex justify-between border-t border-border pt-4 text-lg"><dt>{t.total}</dt><dd>{formatMAD(subtotal - discount + shipping, lang)}</dd></div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">{L(`Livraison offerte dès ${st?.store.free_shipping_threshold ?? 500} MAD`, `توصيل مجاني ابتداءً من ${st?.store.free_shipping_threshold ?? 500} درهم`)}</p>
      {children}
    </aside>
  );
}

function FreeBar({ subtotal, free }: { subtotal: number; free: number }) {
  const { L, lang } = useI18n();
  const left = Math.max(0, free - subtotal);
  const pct = free === 0 ? 100 : Math.min(100, (subtotal / free) * 100);
  return (
    <div className="mt-8 border border-border bg-card p-4 font-sans text-sm">
      <p>{left > 0 ? L(`Plus que ${formatMAD(left, lang)} pour la livraison offerte`, `تبقى ${formatMAD(left, lang)} للتوصيل المجاني`) : L("Livraison offerte sur votre commande", "التوصيل مجاني لطلبك")}</p>
      <div className="mt-3 h-1 bg-border"><div className="h-1 bg-champagne transition-all" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
