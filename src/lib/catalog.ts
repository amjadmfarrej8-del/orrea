import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import fashionCampaign from "@/assets/fashion-campaign.jpg";
import streetwearCampaign from "@/assets/streetwear-campaign.webp";
import streetwearFemme from "@/assets/streetwear-femme.jpg";
import streetwearHomme from "@/assets/ensemble-noir-porte.png";
import creamAsset from "@/assets/theravene-creme-zones-intimes.png";
import eyeAsset from "@/assets/theravene-contour-yeux.png";
import gelAsset from "@/assets/theravene-gel-nettoyant.png";
import gelEyeCreamPackAsset from "@/assets/theravene-pack-gel-contour-creme-v3.png";
import gelEyePackAsset from "@/assets/theravene-pack-gel-contour-yeux-v3.png";
import solaireGelEyePackAsset from "@/assets/theravene-pack-solaire-gel-contour-v5.png";
import packAsset from "@/assets/theravene-pack-zones-intimes.png";
import serumAsset from "@/assets/theravene-serum-zones-intimes.png";
import solaireAsset from "@/assets/theravene-creme-solaire-v3.png";
import eyeCategoryAsset from "@/assets/theravene-categorie-soins-yeux.png";
import faceCategoryAsset from "@/assets/theravene-cat-visage.png";
import sensiblesCategoryAsset from "@/assets/theravene-cat-sensibles-v2.png";
import solaireCategoryAsset from "@/assets/theravene-cat-solaire-v3.png";
import catHoodies from "@/assets/cat-hoodies.jpg";
import catTshirts from "@/assets/cat-tshirts.jpg";
import catPantalons from "@/assets/cat-pantalons.jpg";
import catEnsembles from "@/assets/cat-ensembles.jpg";
import catJackets from "@/assets/cat-jackets.jpg";
import storyAsset from "@/assets/orrea-story.png";
import collectionHommeAsset from "@/assets/orrea-collection-homme.webp";
import collectionFemmeAsset from "@/assets/orrea-collection-femme.webp";
import bannerAsset from "@/assets/orrea-streetwear-banner.webp";
import heroDesktopAsset from "@/assets/orrea-hero-desktop5.webp";
import heroTabletAsset from "@/assets/orrea-hero-tablet.webp";
import heroMobileAsset from "@/assets/orrea-hero-mobile.webp";
import doudouneNoireAsset from "@/assets/orrea-doudoune-noire-v2.webp";
import doudouneVioletteAsset from "@/assets/orrea-doudoune-violette-v2.webp";
import jeanDechireAsset from "@/assets/orrea-jean-dechire.webp";
import jeanVintageAsset from "@/assets/orrea-jean-vintage.webp";

const files = import.meta.glob("@/assets/t-*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const localImages: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").at(-1)?.replace(".jpg", "") ?? path, url]),
);
Object.assign(localImages, {
  "orrea-collection-homme": collectionHommeAsset,
  "orrea-collection-femme": collectionFemmeAsset,
  "orrea-streetwear-banner": bannerAsset,
  "orrea-hero-desktop": heroDesktopAsset,
  "orrea-hero-tablet": heroTabletAsset,
  "orrea-hero-mobile": heroMobileAsset,
  "orrea-story": storyAsset,
  "orrea-doudoune-noire": doudouneNoireAsset,
  "orrea-doudoune-violette": doudouneVioletteAsset,
  "orrea-jean-dechire": jeanDechireAsset,
  "orrea-jean-vintage": jeanVintageAsset,
  "fashion-campaign": fashionCampaign,
  "fashion-femme": streetwearFemme,
  "fashion-homme": streetwearHomme,
  "streetwear-campaign": streetwearCampaign,
  "t-cream": creamAsset,
  "t-eye": eyeAsset,
  "t-gel": gelAsset,
  "t-pack-gel-eye-cream": gelEyeCreamPackAsset,
  "t-pack-gel-eye": gelEyePackAsset,
  "t-pack-solaire-gel-eye": solaireGelEyePackAsset,
  "t-pack": packAsset,
  "t-serum": serumAsset,
  "t-solaire": solaireAsset,
  "t-cat-yeux": eyeCategoryAsset,
  "t-cat-visage": faceCategoryAsset,
  "t-cat-sensibles": sensiblesCategoryAsset,
  "t-cat-solaire": solaireCategoryAsset,
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
