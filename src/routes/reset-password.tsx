import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AuthShell, Field } from "@/components/site/AuthShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — ORRÉA" },
      { name: "description", content: "Choisissez un nouveau mot de passe." },
      { property: "og:title", content: "Nouveau mot de passe — ORRÉA" },
      { property: "og:description", content: "Choisissez un nouveau mot de passe ORRÉA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { L } = useI18n();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return void setErr(L("8 caractères minimum.", "8 أحرف على الأقل."));
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return void setErr(error.message);
    navigate({ to: "/account" });
  };
  return (
    <AuthShell title={L("Nouveau mot de passe", "كلمة مرور جديدة")}>
      <form onSubmit={submit} className="space-y-7">
        <Field label={L("Mot de passe", "كلمة المرور")} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className="btn-lux w-full">{L("Enregistrer", "حفظ")}</button>
      </form>
    </AuthShell>
  );
}
