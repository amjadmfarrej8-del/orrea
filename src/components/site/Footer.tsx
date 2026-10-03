import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { settingsQuery, waLink } from "@/lib/settings";
import { Logo } from "./Header";

export function Footer() {
  const { t, L, lang } = useI18n();
  const { data: s } = useQuery(settingsQuery);
  const store = s?.store;
  const col = "flex flex-col gap-3 text-sm text-muted-foreground";
  return (
    <footer className="mt-32 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4 md:px-10">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-4 text-sm text-muted-foreground">{t.footerText}</p>
        </div>
        <div className={col}>
          <p className="eyebrow">{L("Maison", "الدار")}</p>
          <Link to="/shop" className="link-lux self-start">{t.shop}</Link>
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
          {store?.phone && <a href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a>}
          {store?.email && <a href={`mailto:${store.email}`}>{store.email}</a>}
          {store && <span>{lang === "ar" ? store.address_ar : store.address_fr}</span>}
          <div className="flex gap-4 pt-2">
            {store?.whatsapp && <a href={waLink(store.whatsapp, "Bonjour THÉRAVÉN")} target="_blank" rel="noreferrer" className="link-lux">WhatsApp</a>}
            {store?.instagram && <a href={store.instagram} target="_blank" rel="noreferrer" className="link-lux">Instagram</a>}
            {store?.facebook && <a href={store.facebook} target="_blank" rel="noreferrer" className="link-lux">Facebook</a>}
            {store?.tiktok && <a href={store.tiktok} target="_blank" rel="noreferrer" className="link-lux">TikTok</a>}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} THÉRAVÉN. {t.rights}
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  const { data: s } = useQuery(settingsQuery);
  const { L } = useI18n();
  if (!s?.store.whatsapp) return null;
  return (
    <a
      href={waLink(s.store.whatsapp, L("Bonjour THÉRAVÉN, j'ai une question.", "مرحباً THÉRAVÉN، لدي سؤال."))}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 end-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
    </a>
  );
}
