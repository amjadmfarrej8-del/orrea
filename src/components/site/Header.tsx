import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { settingsQuery } from "@/lib/settings";

export function Logo({ className = "" }: { className?: string }) {
  const { data } = useQuery(settingsQuery);
  if (data?.theme.logo_url) return <img src={data.theme.logo_url} alt="THÉRAVÉN" className={`h-8 w-auto ${className}`} />;
  return <span className={`tracking-[0.16em] ${className}`} style={{ fontFamily: "var(--font-display)" }}>THÉRAVÉN</span>;
}

export function Header() {
  const { t, lang, setLang, L } = useI18n();
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const { data: s } = useQuery(settingsQuery);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const free = s?.store.free_shipping_threshold ?? 500;

  const links = [
    { to: "/shop", label: t.shop },
    { to: "/offres", label: L("Offres", "العروض") },
    { to: "/categories", label: L("Catégories", "الفئات") },
    { to: "/about", label: t.about },
    { to: "/contact", label: L("Contact", "اتصل بنا") },
  ] as const;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(false);
    setOpen(false);
    navigate({ to: "/shop", search: { q: q.trim().slice(0, 80) || undefined } });
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="whitespace-nowrap bg-primary py-2 text-center text-[0.55rem] tracking-[0.08em] uppercase text-primary-foreground md:text-[0.8rem] md:tracking-[0.16em]">
          {L(`Livraison offerte dès ${free} MAD`, `توصيل مجاني ابتداءً من ${free} درهم`)} · {t.cod}
        </div>
        <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-5 py-4 md:px-10 md:py-5 lg:px-12 xl:px-16">
          <div className="flex min-w-0 items-center md:hidden">
            <button onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-5 w-5" strokeWidth={1.2} /></button>
          </div>
          <Link to="/" className="col-start-2 text-center text-2xl md:col-start-1 md:row-start-1 md:justify-self-start md:text-3xl"><Logo /></Link>
          <nav className="hidden items-center justify-center gap-7 text-[0.8rem] tracking-[0.12em] uppercase md:col-start-2 md:row-start-1 md:flex lg:gap-9 xl:gap-11">
            {links.map((l) => <Link key={l.to} to={l.to} className="link-lux whitespace-nowrap">{l.label}</Link>)}
          </nav>
          <div className="col-start-3 row-start-1 flex min-w-0 items-center justify-end gap-4 text-[0.8rem] tracking-[0.12em] uppercase md:gap-5 lg:gap-6">
            <button onClick={() => setSearch((v) => !v)} aria-label={L("Rechercher", "بحث")}><Search className="h-5 w-5" strokeWidth={1.2} /></button>
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="link-lux hidden md:inline">{lang === "fr" ? "عربي" : "FR"}</button>
            <Link to={user ? "/account" : "/login"} className="hidden md:inline" aria-label={L("Compte", "الحساب")}><User className="h-5 w-5" strokeWidth={1.2} /></Link>
            {isAdmin && <Link to="/admin" className="link-lux hidden lg:inline">Admin</Link>}
            <Link to="/cart" className="relative" aria-label={t.cart}>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.2} />
              {count > 0 && (
                <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[0.8rem] text-primary">{count}</span>
              )}
            </Link>
          </div>
        </div>
        {search && (
          <form onSubmit={submit} className="border-t border-border">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={L("Rechercher un soin, un ingrédient…", "ابحثي عن منتج أو مكون…")} className="flex-1 bg-transparent py-2 text-sm outline-none" />
            </div>
          </form>
        )}
      </header>
      {open && (
        <div
          className="fixed inset-0 z-[9999] md:hidden"
          style={{ background: "var(--color-background, #f8f5ef)" }}
        >
          <div className="flex items-center justify-between px-5 py-5">
            <Logo className="text-2xl" />
            <button onClick={() => setOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></button>
          </div>
          <nav className="flex flex-col gap-1 px-5 pt-6">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="border-b border-border py-4 text-3xl" style={{ fontFamily: "var(--font-display)" }}>{l.label}</Link>
            ))}
            <Link to={user ? "/account" : "/login"} onClick={() => setOpen(false)} className="border-b border-border py-4 text-3xl" style={{ fontFamily: "var(--font-display)" }}>{user ? L("Mon compte", "حسابي") : L("Connexion", "تسجيل الدخول")}</Link>
            <Link to="/track" onClick={() => setOpen(false)} className="border-b border-border py-4 text-3xl" style={{ fontFamily: "var(--font-display)" }}>{L("Suivre ma commande", "تتبع طلبي")}</Link>
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="border-b border-border py-4 text-3xl" style={{ fontFamily: "var(--font-display)" }}>Admin</Link>}
            <button onClick={() => { setLang(lang === "fr" ? "ar" : "fr"); setOpen(false); }} className="mt-8 self-start btn-ghost-lux">{lang === "fr" ? "عربي" : "Français"}</button>
          </nav>
        </div>
      )}
    </>
  );
}
