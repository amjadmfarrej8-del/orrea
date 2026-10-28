import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { settingsQuery } from "@/lib/settings";
import { Logo } from "./Header";
import { Reassurance } from "./Reassurance";

export function Footer() {
  const { t, L } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const store = s?.store;
  const col = "flex flex-col gap-3 text-sm text-muted-foreground";
  return (
    <footer className="mt-32 border-t border-border bg-card">
      <div className="border-b border-border"><div className="mx-auto max-w-[1600px]"><Reassurance /></div></div>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4 md:px-10">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-4 text-sm text-muted-foreground">{t.footerText}</p>
        </div>
        <div className={col}>
          <p className="eyebrow">{L("Maison", "الدار")}</p>
          <Link to="/shop" className="link-lux self-start">{t.shop}</Link>
          <Link to="/offres" className="link-lux self-start">{L("Offres", "العروض")}</Link>
          <Link to="/categories" className="link-lux self-start">{L("Catégories", "الفئات")}</Link>
          <Link to="/about" className="link-lux self-start">{t.about}</Link>
          <Link to="/contact" className="link-lux self-start">{L("Contact", "اتصل بنا")}</Link>
        </div>
        <div className={col}>
          <p className="eyebrow">{L("Aide", "المساعدة")}</p>
          <Link to="/faq" className="link-lux self-start">FAQ</Link>
          <Link to="/track" className="link-lux self-start">{L("Suivi de commande", "تتبع الطلب")}</Link>
          <Link to="/shipping" className="link-lux self-start">{L("Livraison & retours", "التوصيل والإرجاع")}</Link>
          <Link to="/privacy" className="link-lux self-start">{L("Confidentialité", "الخصوصية")}</Link>
          <Link to="/terms" className="link-lux self-start">{L("Conditions générales", "الشروط والأحكام")}</Link>
        </div>
        <div className={col}>
          <p className="eyebrow">{L("Nous joindre", "تواصلي معنا")}</p>
          {hydrated && store?.phone && <a href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a>}
          {hydrated && store?.email && <a href={`mailto:${store.email}`}>{store.email}</a>}
          <div className="flex gap-4 pt-2">
            {hydrated && store?.instagram && <a href={store.instagram} target="_blank" rel="noreferrer" className="link-lux">Instagram</a>}
            {hydrated && store?.facebook && <a href={store.facebook} target="_blank" rel="noreferrer" className="link-lux">Facebook</a>}
            {hydrated && store?.tiktok && <a href={store.tiktok} target="_blank" rel="noreferrer" className="link-lux">TikTok</a>}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ORRÉA. {t.rights}
      </div>
    </footer>
  );
}

