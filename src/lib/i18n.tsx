import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";

const dict = {
  fr: {
    shop: "Boutique", about: "La Maison", cart: "Panier", home: "Accueil",
    heroEyebrow: "Haute cosmétique · Collection 2026",
    heroTitle: "La science de l'éclat, l'art de la douceur.",
    heroText: "Des soins d'exception formulés avec des actifs précieux et des ingrédients d'origine naturelle.",
    discover: "Découvrir la collection",
    featured: "La sélection", bestsellers: "Les incontournables",
    viewAll: "Tout voir",
    ritualEyebrow: "Le rituel THÉRAVÈNE",
    ritualTitle: "Trois gestes, une peau transformée.",
    ritualText: "Nettoyer, révéler, nourrir. Un rituel pensé comme un moment de soin pur, où chaque texture se fond dans la peau.",
    values: ["Formules clean", "Testé dermatologiquement", "Livraison partout au Maroc", "Paiement à la livraison"],
    all: "Tout", addToCart: "Ajouter au panier", added: "Ajouté", outOfStock: "Épuisé",
    description: "Description", ingredients: "Ingrédients", usage: "Utilisation",
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
    footerText: "Haute cosmétique d'inspiration française.", rights: "Tous droits réservés.",
    aboutTitle: "Une maison de soin, née d'une exigence.",
    aboutText: "THÉRAVÈNE réunit la rigueur de la formulation française et la richesse des ingrédients précieux. Chaque soin est pensé pour être efficace, sensoriel et respectueux de la peau.",
  },
  ar: {
    shop: "المتجر", about: "الدار", cart: "السلة", home: "الرئيسية",
    heroEyebrow: "مستحضرات راقية · مجموعة 2026",
    heroTitle: "علم الإشراقة، وفن النعومة.",
    heroText: "عناية استثنائية بمكونات فعالة ثمينة ومكونات من أصل طبيعي.",
    discover: "اكتشفي المجموعة",
    featured: "المختارات", bestsellers: "الأكثر مبيعاً",
    viewAll: "عرض الكل",
    ritualEyebrow: "طقوس THÉRAVÈNE",
    ritualTitle: "ثلاث خطوات، بشرة متجددة.",
    ritualText: "تنظيف، إشراق، تغذية. طقس صُمم كلحظة عناية خالصة، حيث يذوب كل قوام في البشرة.",
    values: ["تركيبات نظيفة", "مختبر جلدياً", "توصيل لجميع مدن المغرب", "الدفع عند الاستلام"],
    all: "الكل", addToCart: "أضيفي إلى السلة", added: "تمت الإضافة", outOfStock: "نفدت الكمية",
    description: "الوصف", ingredients: "المكونات", usage: "طريقة الاستعمال",
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
    footerText: "مستحضرات راقية بإلهام فرنسي.", rights: "جميع الحقوق محفوظة.",
    aboutTitle: "دار عناية وُلدت من الإتقان.",
    aboutText: "تجمع THÉRAVÈNE بين دقة التركيب الفرنسي وغنى المكونات الثمينة. كل منتج مصمم ليكون فعالاً وحسياً ولطيفاً على البشرة.",
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
