import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AuthShell, Field } from "@/components/site/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  staticData: { sitemap: false },
  head: () => pageHead({ path: "/forgot-password", title: "Mot de passe oublié | ORRÉA", description: "Réinitialisez votre mot de passe ORRÉA.", noindex: true }),
  component: Forgot,
});

function Forgot() {
  const { L } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setSent(true);
  };
  return (
    <AuthShell title={L("Mot de passe oublié", "نسيت كلمة المرور")}>
      {sent ? (
        <p className="text-center text-muted-foreground">{L("Si un compte existe, un lien vous a été envoyé.", "إذا كان الحساب موجوداً فقد أُرسل إليك رابط.")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-7">
          <Field label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-lux w-full">{L("Envoyer le lien", "إرسال الرابط")}</button>
        </form>
      )}
    </AuthShell>
  );
}
