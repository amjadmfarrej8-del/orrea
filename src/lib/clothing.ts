import { z } from "zod";

export const quickOrderSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom complet.").max(100),
  phone: z.string().trim().regex(/^[+0-9 ]{8,20}$/, "Indiquez un numéro valide."),
  address: z.string().trim().min(5, "Indiquez votre adresse complète.").max(300),
});
export const clothingOptionsSchema = z.object({
  sizes: z.array(z.string().trim().min(1).max(40)).max(30),
  colors: z.array(z.object({ name: z.string().trim().min(1).max(60), image: z.string().max(2000).optional(), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() })),
});
export type ClothingColor = z.infer<typeof clothingOptionsSchema.shape.colors>[number];
export const productColorManagerSchema = clothingOptionsSchema.shape.colors.superRefine((colors, ctx) => {
  const names = new Set<string>();
  colors.forEach((color, index) => {
    if (!color.image?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "image"], message: "Ajoutez une image pour chaque couleur." });
    const name = color.name.toLocaleLowerCase();
    if (names.has(name)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "name"], message: "Chaque couleur doit avoir un nom différent." });
    names.add(name);
  });
});
export const readColors = (value: unknown): ClothingColor[] => {
  const result = clothingOptionsSchema.shape.colors.safeParse(value);
  return result.success ? result.data : [];
};
export function canOrderClothing(p: { price: number; price_confirmed: boolean; stock: number; sizes: string[] }, colors: ClothingColor[], size: string, color: string) {
  return p.price_confirmed && p.price > 0 && p.stock > 0 && (!p.sizes.length || p.sizes.includes(size)) && (!colors.length || colors.some(c => c.name === color));
}