import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; slug: string; name_fr: string; name_ar: string; price: number; image: string; quantity: number; stock: number; free_shipping?: boolean };

type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("th-cart");
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("th-cart", JSON.stringify(items));
  }, [items, ready]);

  const add: Ctx["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.id === item.id);
      if (ex) return prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.min(i.quantity + qty, item.stock, 20) } : i));
      return [...prev, { ...item, quantity: Math.min(qty, item.stock, 20) }];
    });
  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock, 20)) } : i)));
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}

export const hasFreeShipping = (items: { free_shipping?: boolean }[]) => items.some((i) => i.free_shipping);
export const shippingFor = (subtotal: number, fee = 35, free = 500) => (subtotal >= free || subtotal === 0 ? 0 : fee);
