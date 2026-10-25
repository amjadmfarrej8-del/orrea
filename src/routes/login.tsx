import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { safeRedirect, useAuth } from "@/lib/auth";
import { AuthShell, Field } from "@/components/site/AuthShell";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Connexion — THÉRAVÈNE" },
      { name: "description", content: "Connectez-vous à votre compte THÉRAVÈNE." },
      { property: "og:title", content: "Connexion — THÉRAVÈNE" },
      { property: "og:description", content: "Accédez à votre compte THÉRAVÈNE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const { L } = useI18n();
  const { redirect } = Route.useSearch();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: redirect ? safeRedirect(redirect) : isAdmin ? "/admin" : "/account" });
  }, [user, isAdmin, authLoading, redirect, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setErr(L("E-mail ou mot de passe incorrect.", "البريد الإلكتروني أو كلمة المرور غير صحيحة."));
  };

  return (
    <AuthShell title={L("Connexion", "تسجيل الدخول")}>
      <form onSubmit={submit} className="space-y-7">
        <Field label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={L("Mot de passe", "كلمة المرور")} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-end"><Link to="/forgot-password" className="link-lux text-xs text-muted-foreground">{L("Mot de passe oublié ?", "نسيت كلمة المرور؟")}</Link></div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={loading} className="btn-lux w-full">{loading ? "…" : L("Se connecter", "دخول")}</button>
      </form>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        {L("Pas encore de compte ?", "ليس لديك حساب؟")} <Link to="/register" className="link-lux text-foreground">{L("Créer un compte", "إنشاء حساب")}</Link>
      </p>
    </AuthShell>
  );
}
