export const ORDER_STATUSES = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabel: Record<string, { fr: string; ar: string }> = {
  new: { fr: "Nouvelle", ar: "جديد" },
  confirmed: { fr: "Confirmée", ar: "مؤكد" },
  preparing: { fr: "En préparation", ar: "قيد التحضير" },
  shipped: { fr: "Expédiée", ar: "تم الشحن" },
  delivered: { fr: "Livrée", ar: "تم التسليم" },
  cancelled: { fr: "Annulée", ar: "ملغى" },
};
