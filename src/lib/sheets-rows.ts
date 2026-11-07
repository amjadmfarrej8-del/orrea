// Pure helpers that shape orders into Google Sheets rows (one row per ordered product).
import { fullAddress } from "@/lib/orders";

export const SHEET_HEADERS = [
  "Num commande", "Nom produit", "Nom complet", "Adresse complète",
  "Numéro de téléphone", "Taille", "Couleur", "Quantity", "Price",
] as const;

/** Header written by earlier versions: Nom complet, Numéro de téléphone, Adresse complète. */
export const LEGACY_HEADERS = ["Nom complet", "Numéro de téléphone", "Adresse complète"] as const;

export const SHEET_LAST_COLUMN = "I";

export type SheetCell = string | number;

export type SheetOrder = {
  order_number: string | null;
  customer_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  order_items?: {
    product_name: string | null;
    selected_size: string | null;
    selected_color: string | null;
    quantity: number | null;
    unit_price: number | string | null;
  }[] | null;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Price is the product's unit price in MAD, as stored on the order line. */
export function orderToRows(order: SheetOrder): SheetCell[][] {
  const no = order.order_number ?? "";
  const name = order.customer_name ?? "";
  const addr = fullAddress(order.city, order.address);
  const phone = order.phone ?? "";
  const items = order.order_items ?? [];
  if (items.length === 0) return [[no, "", name, addr, phone, "", "", "", ""]];
  return items.map((it) => [
    no, it.product_name ?? "", name, addr, phone,
    it.selected_size ?? "", it.selected_color ?? "", num(it.quantity), num(it.unit_price),
  ]);
}

export function ordersToRows(orders: SheetOrder[]): SheetCell[][] {
  return orders.flatMap(orderToRows);
}

const same = (row: unknown[], expected: readonly string[]) =>
  expected.every((h, i) => String(row[i] ?? "").trim() === h);

export function isCurrentHeader(row: unknown[]) {
  return same(row, SHEET_HEADERS);
}

export function isLegacyHeader(row: unknown[]) {
  return same(row, LEGACY_HEADERS) && String(row[3] ?? "").trim() === "";
}

/** Moves a legacy [name, phone, address] row into the new column positions, keeping its data. */
export function legacyRowToCurrent(row: unknown[]): SheetCell[] {
  const s = (v: unknown) => String(v ?? "");
  return ["", "", s(row[0]), s(row[2]), s(row[1]), "", "", "", ""];
}
