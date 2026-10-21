import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canEnableMetaPixel, pixelIdSchema } from "./meta-pixel";

export const metaPixelSettingsQuery = queryOptions({
  queryKey: ["admin-meta-pixel"],
  queryFn: async () => {
    const { data, error } = await supabase.from("meta_pixel_settings").select("pixel_id, enabled, updated_at").eq("id", true).maybeSingle();
    if (error) throw new Error("Impossible de lire les réglages Meta Pixel.");
    return data ?? { pixel_id: "", enabled: false, updated_at: null };
  },
});

export async function saveMetaPixelSettings(pixelId: string, enabled: boolean) {
  const id = pixelIdSchema.parse(pixelId);
  if (enabled && !canEnableMetaPixel(id)) throw new Error("L’activation nécessite la vérification d’éligibilité et du consentement publicitaire.");
  const { error } = await supabase.from("meta_pixel_settings").upsert({ id: true, pixel_id: id, enabled, updated_at: new Date().toISOString() });
  if (error) throw new Error("Enregistrement impossible. Vérifiez votre accès administrateur.");
}