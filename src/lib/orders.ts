export const ORDER_STATUSES = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabel: Record<OrderStatus, { fr: string; ar: string }> = {
  new: { fr: "Nouvelle", ar: "جديد" },
  confirmed: { fr: "Confirmée", ar: "مؤكد" },
  preparing: { fr: "En préparation", ar: "قيد التحضير" },
  shipped: { fr: "Expédiée", ar: "تم الشحن" },
  delivered: { fr: "Livrée", ar: "تم التسليم" },
  cancelled: { fr: "Annulée", ar: "ملغى" },
};

export const statusText = (s: string, lang: "fr" | "ar") => (statusLabel as Record<string, { fr: string; ar: string } | undefined>)[s]?.[lang] ?? s;

// Couleurs par statut : version douce (puce / bouton inactif) et version pleine (bouton actif).
export const statusTone: Record<string, string> = {
  new: "bg-amber-100 text-amber-900 border-amber-300",
  confirmed: "bg-blue-100 text-blue-900 border-blue-300",
  preparing: "bg-violet-100 text-violet-900 border-violet-300",
  shipped: "bg-sky-100 text-sky-900 border-sky-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  cancelled: "bg-rose-100 text-rose-900 border-rose-300",
};

export const statusSolid: Record<string, string> = {
  new: "bg-amber-600 text-white border-amber-600",
  confirmed: "bg-blue-700 text-white border-blue-700",
  preparing: "bg-violet-700 text-white border-violet-700",
  shipped: "bg-sky-700 text-white border-sky-700",
  delivered: "bg-emerald-700 text-white border-emerald-700",
  cancelled: "bg-rose-700 text-white border-rose-700",
};
