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
  button_fr?: string | undefined; button_ar?: string | undefined; link?: string | undefined; image?: string | undefined; product_ids?: string[] | undefined;
};
export type Settings = { theme: Theme; store: Store; seo: Seo; homepage: { sections: Section[] } };

export const SECTION_TYPES = ["hero", "promo", "benefits", "categories", "featured", "story", "bestsellers", "new", "reviews", "newsletter"] as const;

export const defaultSettings: Settings = {
  theme: { background: "#f8f5ef", foreground: "#2b2724", primary: "#2b2724", primary_hover: "#4a433d", secondary: "#ece6dc", accent: "#e5dccb", champagne: "#c2a77c", radius: 2, logo_url: "", favicon_url: "", display_font: "Cormorant Garamond", body_font: "Jost" },
  store: { shipping_fee: 35, free_shipping_threshold: 500, whatsapp: "", email: "", phone: "", address_fr: "", address_ar: "", instagram: "", facebook: "", tiktok: "" },
  seo: { title_fr: "THÉRAVÉN", title_ar: "THÉRAVÉN", description_fr: "", description_ar: "", og_image: "" },
  homepage: { sections: [] },
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
