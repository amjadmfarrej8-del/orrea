import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import fashionCampaign from "@/assets/fashion-campaign.jpg";
import streetwearCampaign from "@/assets/streetwear-campaign.webp";
import streetwearFemme from "@/assets/streetwear-femme.jpg";
import streetwearHomme from "@/assets/ensemble-noir-porte.png.asset.json";
import creamAsset from "@/assets/theravene-creme-zones-intimes.png.asset.json";
import eyeAsset from "@/assets/theravene-contour-yeux.png.asset.json";
import gelAsset from "@/assets/theravene-gel-nettoyant.png.asset.json";
import gelEyeCreamPackAsset from "@/assets/theravene-pack-gel-contour-creme-v3.png.asset.json";
import gelEyePackAsset from "@/assets/theravene-pack-gel-contour-yeux-v3.png.asset.json";
import solaireGelEyePackAsset from "@/assets/theravene-pack-solaire-gel-contour-v5.png.asset.json";
import packAsset from "@/assets/theravene-pack-zones-intimes.png.asset.json";
import serumAsset from "@/assets/theravene-serum-zones-intimes.png.asset.json";
import solaireAsset from "@/assets/theravene-creme-solaire-v3.png.asset.json";
import eyeCategoryAsset from "@/assets/theravene-categorie-soins-yeux.png.asset.json";
import faceCategoryAsset from "@/assets/theravene-cat-visage.png.asset.json";
import sensiblesCategoryAsset from "@/assets/theravene-cat-sensibles-v2.png.asset.json";
import solaireCategoryAsset from "@/assets/theravene-cat-solaire-v3.png.asset.json";
import catHoodies from "@/assets/cat-hoodies.jpg";
import catTshirts from "@/assets/cat-tshirts.jpg";
import catPantalons from "@/assets/cat-pantalons.jpg";
import catEnsembles from "@/assets/cat-ensembles.jpg";
import catJackets from "@/assets/cat-jackets.jpg";
import storyAsset from "@/assets/orrea-story.png.asset.json";
import collectionHommeAsset from "@/assets/orrea-collection-homme.webp.asset.json";
import collectionFemmeAsset from "@/assets/orrea-collection-femme.webp.asset.json";
import bannerAsset from "@/assets/orrea-streetwear-banner.webp.asset.json";

const files = import.meta.glob("@/assets/t-*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const localImages: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").at(-1)?.replace(".jpg", "") ?? path, url]),
);
Object.assign(localImages, {
  "orrea-collection-homme": collectionHommeAsset.url,
  "orrea-collection-femme": collectionFemmeAsset.url,
  "orrea-streetwear-banner": bannerAsset.url,
  "orrea-story": storyAsset.url,
  "fashion-campaign": fashionCampaign,
  "fashion-femme": streetwearFemme,
  "fashion-homme": streetwearHomme.url,
  "streetwear-campaign": streetwearCampaign,
  "t-cream": creamAsset.url,
  "t-eye": eyeAsset.url,
  "t-gel": gelAsset.url,
  "t-pack-gel-eye-cream": gelEyeCreamPackAsset.url,
  "t-pack-gel-eye": gelEyePackAsset.url,
  "t-pack-solaire-gel-eye": solaireGelEyePackAsset.url,
  "t-pack": packAsset.url,
  "t-serum": serumAsset.url,
  "t-solaire": solaireAsset.url,
  "t-cat-yeux": eyeCategoryAsset.url,
  "t-cat-visage": faceCategoryAsset.url,
  "t-cat-sensibles": sensiblesCategoryAsset.url,
  "t-cat-solaire": solaireCategoryAsset.url,
  "cat-hoodies": catHoodies,
  "cat-tshirts": catTshirts,
  "cat-pantalons": catPantalons,
  "cat-ensembles": catEnsembles,
  "cat-jackets": catJackets,
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
    const { data, error } = await supabase.from("products").select("*, categories(slug, name_fr, name_ar)").eq("is_active", true).order("created_at");
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
