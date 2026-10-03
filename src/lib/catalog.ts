import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import serum from "@/assets/p-serum.jpg";
import cream from "@/assets/p-cream.jpg";
import oil from "@/assets/p-oil.jpg";
import cleanser from "@/assets/p-cleanser.jpg";
import body from "@/assets/p-body.jpg";
import perfume from "@/assets/p-perfume.jpg";

const localImages: Record<string, string> = { serum, cream, oil, cleanser, body, perfume };
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
