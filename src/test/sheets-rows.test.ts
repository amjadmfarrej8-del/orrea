import { describe, expect, it } from "vitest";
import { SHEET_HEADERS, isCurrentHeader, isLegacyHeader, legacyRowToCurrent, ordersToRows } from "@/lib/sheets-rows";

const order = {
  order_number: "TH-0001", customer_name: "Amina", phone: "0612345678", city: "Casablanca", address: "Rue 4",
};

describe("Google Sheets order rows", () => {
  it("uses exactly the requested columns in order", () => {
    expect([...SHEET_HEADERS]).toEqual([
      "Num commande", "Nom produit", "Nom complet", "Adresse complète",
      "Numéro de téléphone", "Taille", "Couleur", "Quantity", "Price",
    ]);
  });

  it("writes one row per product with its own size, color, quantity and unit price", () => {
    const rows = ordersToRows([{
      ...order,
      order_items: [
        { product_name: "Hoodie", selected_size: "M", selected_color: "Noir", quantity: 2, unit_price: "259.00" },
        { product_name: "Jogger", selected_size: "XL", selected_color: "Beige", quantity: 1, unit_price: 199 },
      ],
    }]);
    expect(rows).toEqual([
      ["TH-0001", "Hoodie", "Amina", "Rue 4, Casablanca", "0612345678", "M", "Noir", 2, 259],
      ["TH-0001", "Jogger", "Amina", "Rue 4, Casablanca", "0612345678", "XL", "Beige", 1, 199],
    ]);
  });

  it("keeps the phone number as text so the leading zero stays", () => {
    const [row] = ordersToRows([{ ...order, order_items: [{ product_name: "T", selected_size: null, selected_color: null, quantity: 1, unit_price: 1 }] }]);
    expect(row[4]).toBe("0612345678");
  });

  it("recognises the previous three-column header and moves its rows without losing data", () => {
    expect(isLegacyHeader(["Nom complet", "Numéro de téléphone", "Adresse complète"])).toBe(true);
    expect(isCurrentHeader([...SHEET_HEADERS])).toBe(true);
    expect(legacyRowToCurrent(["Amina", "0612345678", "Rue 4"])).toEqual(["", "", "Amina", "Rue 4", "0612345678", "", "", "", ""]);
  });
});
