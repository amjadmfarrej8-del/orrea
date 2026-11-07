import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { settingsQuery } from "@/lib/settings";
import logoAsset from "@/assets/orrea-logo.png";
import { Button } from "@/components/ui/button";

export function Logo({ className = "" }: { className?: string }) {
  const { data } = useQuery(settingsQuery);
  const src = data?.theme.logo_url || logoAsset.url;
  return <img src={src} alt="ORRÉA" className={`h-8 w-auto ${className}`} />;
}

export function Header() {
  const { t, lang, setLang, L } = useI18n();
  const { count } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const home = useRouterState({ select: (state) => state.location.pathname === "/" });

  const links = [
    { to: "/shop", search: { f: "nouveautes" }, label: L("Nouveautés", "الجديد") },
    { to: "/shop", search: { c: "homme" }, label: L("Homme", "رجال") },
    { to: "/shop", search: { c: "femme" }, label: L("Femme", "نساء") },
    { to: "/shop", search: { f: "best" }, label: L("Best-Sellers", "الأكثر مبيعاً") },
    { to: "/offres", label: L("Offres", "العروض") },
    { to: "/categories", label: L("Collections", "التشكيلات") },
    { to: "/about", label: t.about },
    { to: "/contact", label: L("Contact", "اتصل بنا") },
    { to: "/track", label: L("Suivre ma commande", "تتبع طلبي") },
  ] as const;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(false);
    setOpen(false);
    navigate({ to: "/shop", search: { q: q.trim().slice(0, 80) || undefined } });
  };

  return (
    <>
      <header className={home ? "absolute inset-x-0 top-0 z-40 bg-transparent" : "sticky top-0 z-40 border-b border-border bg-black"}>
        <div className={`${home ? "hidden" : "block"} whitespace-nowrap bg-primary py-2 text-center text-[0.55rem] tracking-[0.08em] uppercase text-primary-foreground md:text-[0.8rem] md:tracking-[0.16em]`}>
          {L("Livraison gratuite sur tous les produits", "توصيل مجاني على جميع المنتجات")} · {t.cod}
        </div>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-5 py-4 md:px-10 lg:px-12">
          <Link to="/" className="shrink-0 text-[26px] md:text-4xl"><Logo /></Link>
          <nav className="hidden items-center justify-center gap-5 text-xs uppercase lg:flex">
            {links.filter((l) => l.to !== "/track").map((l) => <Link key={l.label} to={l.to} {...("search" in l ? { search: l.search } : {})} className="link-lux whitespace-nowrap">{l.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSearch((v) => !v)} aria-label={L("Rechercher", "بحث")}><Search className="size-6" strokeWidth={1.2} /></Button>
            <Button variant="ghost" onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="hidden md:inline-flex">{lang === "fr" ? "عربي" : "FR"}</Button>
            <Link to={user ? "/account" : "/login"} className="hidden md:inline" aria-label={L("Compte", "الحساب")}><User className="size-5" strokeWidth={1.2} /></Link>
            <Link to="/cart" className="relative p-2" aria-label={t.cart}><ShoppingBag className="size-6" strokeWidth={1.2} /><span className="absolute end-0 top-0 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background">{count}</span></Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="size-7" strokeWidth={1.2} /></Button>
          </div>
        </div>
        {search && (
          <form onSubmit={submit} className="border-t border-border bg-background">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={L("Rechercher un article…", "ابحثوا عن قطعة…")} className="flex-1 bg-transparent py-2 text-sm outline-none" />
            </div>
          </form>
        )}
      </header>
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-background lg:hidden"
        >
          <div className="flex items-center justify-between px-5 py-5">
            <Logo className="text-2xl" />
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></Button>
          </div>
          <nav className="flex flex-col gap-1 px-5 pt-6">
            {links.map((l) => (
              <Link key={l.label} to={l.to} {...("search" in l ? { search: l.search } : {})} onClick={() => setOpen(false)} className="border-b border-border py-4 text-2xl" style={{ fontFamily: "var(--font-display)" }}>{l.label}</Link>
            ))}
            <button onClick={() => { setLang(lang === "fr" ? "ar" : "fr"); setOpen(false); }} className="mt-8 self-start btn-ghost-lux">{lang === "fr" ? "عربي" : "Français"}</button>
          </nav>
        </div>
      )}
    </>
  );
}
