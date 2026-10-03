import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AuthShell, Field, GoogleButton } from "@/components/site/AuthShell";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Créer un compte — THÉRAVÉN" },
      { name: "description", content: "Créez votre compte THÉRAVÉN pour suivre vos commandes." },
      { property: "og:title", content: "Créer un compte — THÉRAVÉN" },
      { property: "og:description", content: "Rejoignez la Maison THÉRAVÉN." },
    ],
  }),
  component: Register,
});

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255), password: z.string().min(8).max(72) });

function Register() {
  const { L } = useI18n();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = schema.safeParse(f);
    if (!r.success) return void setErr(L("Vérifiez vos informations (mot de passe : 8 caractères min.).", "تحققي من بياناتك (كلمة المرور 8 أحرف على الأقل)."));
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: r.data.email, password: r.data.password,
      options: { emailRedirectTo: window.location.origin + "/account", data: { full_name: r.data.name } },
    });
    setLoading(false);
    if (error) return void setErr(error.message);
    setDone(true);
  };

  if (done)
    return (
      <AuthShell title={L("Vérifiez votre e-mail", "تحققي من بريدك")}>
        <p className="text-center text-muted-foreground">{L("Un lien de confirmation vous a été envoyé.", "تم إرسال رابط التأكيد إلى بريدك.")}</p>
      </AuthShell>
    );

  return (
    <AuthShell title={L("Créer un compte", "إنشاء حساب")}>
      <form onSubmit={submit} className="space-y-7">
        <Field label={L("Nom complet", "الاسم الكامل")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Field label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Field label={L("Mot de passe", "كلمة المرور")} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={loading} className="btn-lux w-full">{loading ? "…" : L("Créer mon compte", "إنشاء حسابي")}</button>
        <GoogleButton onError={setErr} />
      </form>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        {L("Déjà inscrite ?", "لديك حساب؟")} <Link to="/login" className="link-lux text-foreground">{L("Connexion", "تسجيل الدخول")}</Link>
      </p>
    </AuthShell>
  );
}
