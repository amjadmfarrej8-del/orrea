import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Theme = {
  background: string; foreground: string; primary: string; primary_hover: string; secondary: string;
  accent: string; champagne: string; radius: number; logo_url: string; favicon_url: string;
  display_font: string; body_font: string;
};
export type Store = {
  shipping_fee: number; free_shipping_threshold: number; whatsapp: string; email: string; phone: string;
  address_fr: string; address_ar: string; instagram: string; facebook: string; tiktok: string;
};
export type Seo = { title_fr: string; title_ar: string; description_fr: string; description_ar: string; og_image: string };
export type Section = {
  id: string; type: string; visible: boolean;
  title_fr?: string | undefined; title_ar?: string | undefined; text_fr?: string | undefined; text_ar?: string | undefined;
  button_fr?: string | undefined; button_ar?: string | undefined; link?: string | undefined; image?: string | undefined; image_desktop?: string | undefined; image_tablet?: string | undefined; product_ids?: string[] | undefined;
};
export type Settings = { theme: Theme; store: Store; seo: Seo; homepage: { sections: Section[] } };

export const SECTION_TYPES = ["hero", "promo", "panel", "benefits", "categories", "collections", "banner", "offers", "featured", "story", "bestsellers", "new", "reviews", "newsletter"] as const;

export const defaultSettings: Settings = {
  theme: { background: "#080808", foreground: "#F5F5F5", primary: "#FF6500", primary_hover: "#E85500", secondary: "#141414", accent: "#252525", champagne: "#FF6500", radius: 2, logo_url: "", favicon_url: "", display_font: "Cormorant Garamond", body_font: "Jost" },
  store: { shipping_fee: 0, free_shipping_threshold: 0, whatsapp: "", email: "", phone: "", address_fr: "", address_ar: "", instagram: "", facebook: "", tiktok: "" },
  seo: { title_fr: "ORRÉA — Streetwear homme & mode femme en ligne au Maroc", title_ar: "ORRÉA — أزياء النساء والرجال", description_fr: "ORRÉA, mode en ligne au Maroc : hoodies, t-shirts, ensembles, pantalons et jackets pour homme et femme. Livraison gratuite et paiement à la livraison.", description_ar: "ORRÉA، منظور جديد للأناقة. اكتشفوا عالمي النساء والرجال.", og_image: "" },
  homepage: { sections: [
    { id: "hero", type: "hero", visible: true, title_fr: "MOVE WITH PRESENCE", title_ar: "تحرّك بحضور", text_fr: "STYLE / QUALITY / ATTITUDE", text_ar: "أسلوب / جودة / شخصية", image: "streetwear-campaign", image_desktop: "streetwear-campaign", button_fr: "Découvrir la collection", button_ar: "اكتشفوا المجموعة", link: "/shop" },
    { id: "benefits", type: "benefits", visible: true },
    { id: "categories", type: "categories", visible: true, title_fr: "Nos Collections", title_ar: "مجموعاتنا" },
    { id: "featured", type: "featured", visible: true, title_fr: "L’Essentiel", title_ar: "الأساسيات" },
    { id: "story", type: "story", visible: true, title_fr: "L’allure, simplement.", title_ar: "الأناقة ببساطة.", text_fr: "Le streetwear rencontre le caractère. Une silhouette se dessine, entre liberté et présence. Bienvenue dans l’univers ORRÉA.", text_ar: "يلتقي الأبيض بالأزرق الداكن. إطلالة تجمع البساطة والشخصية. مرحباً بكم في عالم ORRÉA.", image: "orrea-story" },
    { id: "bestsellers", type: "bestsellers", visible: true, title_fr: "Best-Sellers", title_ar: "الأكثر مبيعاً" },
    { id: "new", type: "new", visible: true, title_fr: "Nouvelle Collection", title_ar: "المجموعة الجديدة" },
    { id: "collections", type: "collections", visible: true, title_fr: "Choisir Votre Collection", title_ar: "اختر مجموعتك" },
    { id: "banner", type: "banner", visible: true },
  ] },
};

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async (): Promise<Settings> => {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error) throw error;
    const out = structuredClone(defaultSettings) as Record<string, unknown>;
    for (const row of data) out[row.key] = { ...(out[row.key] as object), ...(row.value as object) };
    return out as Settings;
  },
  staleTime: 60_000,
});

export async function saveSetting(key: keyof Settings, value: unknown) {
  const { error } = await supabase.from("site_settings").upsert({ key, value: value as never, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function waLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Uploads a file to private media storage and returns a long-lived signed URL. */
export async function uploadMedia(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Image uniquement");
  if (file.size > 10 * 1024 * 1024) throw new Error("10 MB max");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const signed = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}
