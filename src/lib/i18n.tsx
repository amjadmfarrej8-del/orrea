import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";

const dict = {
  fr: {
    shop: "Boutique", about: "La Maison", cart: "Panier", home: "Accueil",
    heroEyebrow: "Mode · Femme & Homme",
    heroTitle: "L’allure, simplement.",
    heroText: "Une nouvelle perspective sur le style. Lignes épurées, allure libre.",
    discover: "Découvrir la collection",
    featured: "La sélection", bestsellers: "Les incontournables",
    viewAll: "Tout voir",
    ritualEyebrow: "L’univers THÉRAVÈNE",
    ritualTitle: "Le style en mouvement.",
    ritualText: "Le blanc et le bleu marine. La simplicité et le caractère. Une autre façon de penser l’allure.",
    values: ["Livraison offerte dès 500 MAD", "Service client", "Livraison partout au Maroc", "Paiement à la livraison"],
    all: "Tout", addToCart: "Ajouter au panier", added: "Ajouté", outOfStock: "Épuisé",
    description: "Description", ingredients: "Composition", usage: "Entretien",
    emptyCart: "Votre panier est vide.", continueShopping: "Continuer mes achats",
    subtotal: "Sous-total", shipping: "Livraison", total: "Total", free: "Offerte",
    freeShippingNote: "Livraison offerte dès 500 MAD", checkout: "Commander", remove: "Retirer",
    checkoutTitle: "Finaliser la commande", fullName: "Nom complet", phone: "Téléphone",
    email: "E-mail (facultatif)", city: "Ville", address: "Adresse complète", notes: "Note (facultatif)",
    cod: "Paiement à la livraison", codText: "Vous réglez en espèces à la réception de votre commande.",
    placeOrder: "Confirmer la commande", placing: "Envoi…", summary: "Récapitulatif",
    thanksTitle: "Merci pour votre commande", thanksText: "Notre équipe vous contactera par téléphone pour confirmer la livraison.",
    orderNumber: "Numéro de commande", products: "produits", errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    errOutOfStock: "Stock insuffisant pour :", qty: "Qté",
    footerText: "Mode Femme & Homme. L’allure, simplement.", rights: "Tous droits réservés.",
    aboutTitle: "THÉRAVÈNE, une nouvelle allure.",
    aboutText: "THÉRAVÈNE ouvre un nouveau chapitre : la mode. Notre univers fait dialoguer le blanc et le bleu marine, la simplicité et le caractère. Une vision du style qui laisse toute sa place à votre personnalité.",
  },
  ar: {
    shop: "المتجر", about: "الدار", cart: "السلة", home: "الرئيسية",
    heroEyebrow: "أزياء · نساء ورجال",
    heroTitle: "الأناقة ببساطة.",
    heroText: "منظور جديد للأناقة. خطوط بسيطة وحضور حرّ.",
    discover: "اكتشفي المجموعة",
    featured: "المختارات", bestsellers: "الأكثر مبيعاً",
    viewAll: "عرض الكل",
    ritualEyebrow: "عالم THÉRAVÈNE",
    ritualTitle: "أناقة تتحرك معكم.",
    ritualText: "الأبيض والأزرق الداكن. البساطة والشخصية. منظور جديد للأناقة.",
    values: ["توصيل مجاني ابتداءً من 500 درهم", "خدمة العملاء", "توصيل لجميع مدن المغرب", "الدفع عند الاستلام"],
    all: "الكل", addToCart: "أضيفي إلى السلة", added: "تمت الإضافة", outOfStock: "نفدت الكمية",
    description: "الوصف", ingredients: "الخامة", usage: "العناية",
    emptyCart: "سلتك فارغة.", continueShopping: "متابعة التسوق",
    subtotal: "المجموع الفرعي", shipping: "التوصيل", total: "المجموع", free: "مجاني",
    freeShippingNote: "توصيل مجاني ابتداءً من 500 درهم", checkout: "إتمام الطلب", remove: "حذف",
    checkoutTitle: "إتمام الطلب", fullName: "الاسم الكامل", phone: "الهاتف",
    email: "البريد الإلكتروني (اختياري)", city: "المدينة", address: "العنوان الكامل", notes: "ملاحظة (اختياري)",
    cod: "الدفع عند الاستلام", codText: "تدفعين نقداً عند استلام طلبك.",
    placeOrder: "تأكيد الطلب", placing: "جارٍ الإرسال…", summary: "ملخص الطلب",
    thanksTitle: "شكراً لطلبك", thanksText: "سيتصل بك فريقنا هاتفياً لتأكيد التوصيل.",
    orderNumber: "رقم الطلب", products: "منتجات", errorGeneric: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    errOutOfStock: "الكمية غير كافية لـ:", qty: "الكمية",
    footerText: "أزياء النساء والرجال. الأناقة ببساطة.", rights: "جميع الحقوق محفوظة.",
    aboutTitle: "THÉRAVÈNE، إطلالة جديدة.",
    aboutText: "تفتح THÉRAVÈNE فصلاً جديداً في عالم الأزياء. يجمع عالمنا الأبيض والأزرق الداكن والبساطة والشخصية. رؤية للأناقة تترك المجال لشخصيتكم.",
  },
} as const;

type Dict = (typeof dict)["fr"];
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict; L: (fr: string, ar: string) => string };

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = localStorage.getItem("th-lang");
    if (saved === "ar" || saved === "fr") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    localStorage.setItem("th-lang", l);
    setLangState(l);
  };
  return <I18nCtx.Provider value={{ lang, setLang, t: dict[lang] as Dict, L: (fr: string, ar: string) => (lang === "ar" ? ar : fr) }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

export function formatMAD(n: number, lang: Lang) {
  const v = new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-MA", { maximumFractionDigits: 0 }).format(n);
  return lang === "ar" ? `${v} درهم` : `${v} MAD`;
}
