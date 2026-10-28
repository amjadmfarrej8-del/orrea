import { Truck, Banknote, ShieldCheck, Headphones } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Reassurance({ compact = false }: { compact?: boolean }) {
  const { L } = useI18n();
  const items = [
    { icon: Truck, t: L("Livraison partout au Maroc", "التوصيل لكل المغرب"), d: L("Offerte dès 500 MAD", "مجاني ابتداءً من 500 درهم") },
    { icon: Banknote, t: L("Paiement à la livraison", "الدفع عند الاستلام"), d: L("Réglez en espèces à réception", "ادفعي نقداً عند الاستلام") },
    { icon: ShieldCheck, t: L("Produits authentiques", "منتجات أصلية"), d: L("Directement de la maison ORRÉA", "مباشرة من دار ORRÉA") },
    { icon: Headphones, t: L("Service client", "خدمة العملاء"), d: L("Une équipe à votre écoute", "فريق في خدمتك") },
  ];
  return (
    <ul className={`grid grid-cols-2 gap-px bg-border ${compact ? "" : "md:grid-cols-4"}`}>
      {items.map(({ icon: Icon, t, d }) => (
        <li key={t} className="flex flex-col items-center gap-2 bg-background px-3 py-5 text-center md:py-7">
          <Icon className="h-5 w-5 text-champagne" strokeWidth={1.4} />
          <p className="font-sans text-[0.68rem] font-medium tracking-[0.12em] uppercase md:text-[0.74rem]">{t}</p>
          <p className="font-sans text-[0.7rem] text-muted-foreground md:text-xs">{d}</p>
        </li>
      ))}
    </ul>
  );
}
