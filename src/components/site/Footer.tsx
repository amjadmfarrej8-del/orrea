import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-32 border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-16 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="text-4xl tracking-[0.3em]" style={{ fontFamily: "var(--font-display)" }}>THÉRAVÉN</p>
          <p className="mt-3 text-sm text-muted-foreground">{t.footerText}</p>
        </div>
        <nav className="flex gap-8 text-[0.72rem] tracking-[0.2em] uppercase">
          <Link to="/shop" className="link-lux">{t.shop}</Link>
          <Link to="/about" className="link-lux">{t.about}</Link>
          <Link to="/cart" className="link-lux">{t.cart}</Link>
        </nav>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} THÉRAVÉN. {t.rights}
      </div>
    </footer>
  );
}
