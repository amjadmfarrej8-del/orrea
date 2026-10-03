import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import tSerum from "@/assets/t-serum.jpg";
import tCream from "@/assets/t-cream.jpg";
import tGel from "@/assets/t-gel.jpg";
import tEye from "@/assets/t-eye.jpg";

const localImages: Record<string, string> = { "t-serum": tSerum, "t-cream": tCream, "t-gel": tGel, "t-eye": tEye };
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
