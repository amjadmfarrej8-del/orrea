import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import creamAsset from "@/assets/theravene-creme-zones-intimes.png.asset.json";
import eyeAsset from "@/assets/theravene-contour-yeux.png.asset.json";
import gelAsset from "@/assets/theravene-gel-nettoyant.png.asset.json";
import gelEyeCreamPackAsset from "@/assets/theravene-pack-gel-contour-creme.png.asset.json";
import gelEyePackAsset from "@/assets/theravene-pack-gel-contour-yeux.png.asset.json";
import packAsset from "@/assets/theravene-pack-zones-intimes.png.asset.json";
import serumAsset from "@/assets/theravene-serum-zones-intimes.png.asset.json";

const files = import.meta.glob("@/assets/t-*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const localImages: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").at(-1)?.replace(".jpg", "") ?? path, url]),
);
Object.assign(localImages, {
  "t-cream": creamAsset.url,
  "t-eye": eyeAsset.url,
  "t-gel": gelAsset.url,
  "t-pack-gel-eye-cream": gelEyeCreamPackAsset.url,
  "t-pack-gel-eye": gelEyePackAsset.url,
  "t-pack": packAsset.url,
  "t-serum": serumAsset.url,
});
export const productImage = (key: string) => localImages[key] ?? key;

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*, categories(slug)").eq("is_active", true).order("created_at");
    if (error) throw error;
    return data;
  },
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type Product = Awaited<ReturnType<NonNullable<typeof productsQuery.queryFn>>>[number];
