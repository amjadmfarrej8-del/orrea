import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { shippingFor, useCart } from "@/lib/cart";
import { productImage } from "@/lib/catalog";
import { formatMAD, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Panier — THÉRAVÉN" },
      { name: "description", content: "Votre panier THÉRAVÉN." },
      { property: "og:title", content: "Panier — THÉRAVÉN" },
      { property: "og:description", content: "Votre sélection de soins THÉRAVÉN." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const { items, setQty, remove, subtotal } = useCart();
  const shipping = shippingFor(subtotal);

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <h1 className="text-5xl">{t.cart}</h1>
        <p className="mt-6 text-muted-foreground">{t.emptyCart}</p>
        <Link to="/shop" className="btn-lux mt-10">{t.continueShopping}</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-5 pt-16 md:grid-cols-[1fr_340px] md:px-10">
      <div>
        <h1 className="text-5xl">{t.cart}</h1>
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
    </div>
  );
}

export function Summary({ subtotal, shipping, children }: { subtotal: number; shipping: number; children?: React.ReactNode }) {
  const { t, lang } = useI18n();
  return (
    <aside className="h-fit bg-card p-8 md:mt-20">
      <p className="eyebrow">{t.summary}</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between"><dt>{t.subtotal}</dt><dd>{formatMAD(subtotal, lang)}</dd></div>
        <div className="flex justify-between"><dt>{t.shipping}</dt><dd>{shipping === 0 ? t.free : formatMAD(shipping, lang)}</dd></div>
        <div className="flex justify-between border-t border-border pt-4 text-lg"><dt>{t.total}</dt><dd>{formatMAD(subtotal + shipping, lang)}</dd></div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">{t.freeShippingNote}</p>
      {children}
    </aside>
  );
}
