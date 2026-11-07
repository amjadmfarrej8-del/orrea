import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/orrea-logo.png";

export const Route = createFileRoute("/_authenticated/admin")({ staticData: { sitemap: false },
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [{ title: "Administration — ORRÉA" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Vue d'ensemble", exact: true },
  { to: "/admin/orders", label: "Commandes" },
  { to: "/admin/products", label: "Produits & stock" },
  { to: "/admin/packs", label: "Packs / Offres" },
  { to: "/admin/categories", label: "Catégories" },
  { to: "/admin/customers", label: "Clients" },
  { to: "/admin/coupons", label: "Codes promo" },
  { to: "/admin/shipping", label: "Livraison" },
  { to: "/admin/homepage", label: "Page d'accueil" },
  { to: "/admin/theme", label: "Thème" },
  { to: "/admin/sheets", label: "Google Sheets" },
  { to: "/admin/settings", label: "Boutique & SEO" },
  { to: "/admin/meta-pixel", label: "Meta Pixel" },
] as const;

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const links = (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: "exact" in n }}
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          activeProps={{ className: "bg-secondary !text-foreground" }}
        >
          {n.label}
        </Link>
      ))}
      <Link to="/" className="mt-6 px-3 py-2 text-xs tracking-[0.12em] uppercase link-lux">← Voir la boutique</Link>
    </nav>
  );
  return (
    <div className="min-h-screen bg-card font-sans [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_h4]:font-sans" dir="ltr">
      <div className="flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
        <img src={logoAsset.url} alt="ORRÉA" className="h-5 w-auto" />
        <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && <div className="border-b border-border bg-background p-4 md:hidden">{links}</div>}
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-e border-border bg-background p-6 md:block">
          <img src={logoAsset.url} alt="ORRÉA" className="mb-1 h-7 w-auto" />
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Administration</p>
          {links}
        </aside>
        <main className="min-w-0 flex-1 p-5 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
