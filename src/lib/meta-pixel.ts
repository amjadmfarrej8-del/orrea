import { z } from "zod";

export const pixelIdSchema = z.string().trim().refine(
  (value) => value === "" || /^[0-9]{5,30}$/.test(value),
  "Saisissez uniquement l’identifiant numérique du Pixel (5 à 30 chiffres).",
);

// Remains false until dataset eligibility and advertising consent are verified.
// An entered Pixel ID is configuration, never account authorization.
export function canEnableMetaPixel(_pixelId: string): boolean {
  return false;
}

export const metaEvents = [
  { name: "PageView", action: "Affichage d’une page publique éligible." },
  { name: "ViewContent", action: "Affichage d’une fiche produit éligible." },
  { name: "InitiateCheckout", action: "Ouverture de la commande avec un panier non vide." },
  { name: "Purchase", action: "Confirmation réussie par la boutique, une seule fois par commande ; montant réel en MAD. Paiement à la livraison, pas paiement encaissé." },
] as const;