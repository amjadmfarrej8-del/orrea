import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, Save, RefreshCw, ShieldCheck, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { AField, Input, PageTitle } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { metaPixelSettingsQuery, saveMetaPixelSettings } from "@/lib/meta-pixel-settings";
import { metaEvents, pixelIdSchema } from "@/lib/meta-pixel";

export const Route = createFileRoute("/_authenticated/admin/meta-pixel")({ staticData: { sitemap: false },
  loader: ({ context }) => context.queryClient.ensureQueryData(metaPixelSettingsQuery),
  head: () => ({ meta: [
    { title: "Meta Pixel — Administration ORRÉA" },
    { name: "description", content: "Configuration administrateur et diagnostic du Meta Pixel de ORRÉA." },
    { property: "og:title", content: "Meta Pixel — ORRÉA" },
    { property: "og:description", content: "Réglages et préparation du suivi publicitaire de la boutique." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: MetaPixelPage,
});

function MetaPixelPage() {
  const qc = useQueryClient();
  const { data: settings } = useSuspenseQuery(metaPixelSettingsQuery);
  const [pixelId, setPixelId] = useState(settings.pixel_id);
  const [saving, setSaving] = useState(false);
  const [baseDetected, setBaseDetected] = useState<boolean | null>(null);
  const [checkedAt, setCheckedAt] = useState("");
  const [fieldError, setFieldError] = useState("");
  useEffect(() => { setPixelId(settings.pixel_id); }, [settings.pixel_id]);

  function diagnose() {
    setBaseDetected(Array.from(document.scripts).some((script) => /connect\.facebook\.net\/.*fbevents\.js/.test(script.src)));
    setCheckedAt(new Date().toLocaleTimeString("fr-FR"));
  }
  useEffect(() => { diagnose(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const result = pixelIdSchema.safeParse(pixelId);
    if (!result.success) { setFieldError(result.error.issues[0]?.message ?? "Identifiant invalide."); return; }
    setFieldError("");
    setSaving(true);
    try {
      await saveMetaPixelSettings(result.data, false);
      await qc.invalidateQueries({ queryKey: ["admin-meta-pixel"] });
      toast.success("Identifiant enregistré. Le suivi reste désactivé.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-5xl">
      <PageTitle title="Meta Pixel">
        <Button asChild variant="outline"><a href="https://business.facebook.com/events_manager2/" target="_blank" rel="noopener noreferrer"><ExternalLink />Connecter à Meta</a></Button>
      </PageTitle>
      <section className="mb-8 border-s-2 border-champagne bg-secondary p-5">
        <h2 className="flex items-center gap-2 text-lg font-medium"><CircleAlert className="h-5 w-5 shrink-0" />Activation en attente</h2>
        <p className="mt-2 text-sm leading-relaxed">Le changement d’identité vers la mode n’autorise pas automatiquement le suivi. Le catalogue réellement publié, les anciennes pages et les données transmises doivent être examinés pour exclure toute information sensible. Les restrictions du jeu de données et l’éligibilité doivent être vérifiées dans Meta Events Manager avant toute installation.</p>
        <p className="mt-2 text-sm leading-relaxed">Aucun code Meta ni événement publicitaire n’est installé par cette page. Les commandes restent inchangées.</p>
      </section>

      <form onSubmit={save} className="border-b border-border pb-8">
        <h2 className="mb-5 text-xl">Configuration</h2>
        <div className="max-w-lg">
          <AField label="Identifiant du Meta Pixel"><Input aria-label="Identifiant du Meta Pixel" inputMode="numeric" autoComplete="off" maxLength={30} value={pixelId} onChange={(e) => { setPixelId(e.target.value); setFieldError(""); }} aria-invalid={!!fieldError} aria-describedby="pixel-id-help" /></AField>
          <p id="pixel-id-help" className="mt-2 text-sm text-muted-foreground">Copiez l’identifiant numérique affiché dans les paramètres du Pixel. Ne saisissez ni jeton d’accès ni mot de passe.</p>
          {fieldError && <p role="alert" className="mt-2 text-sm text-destructive">{fieldError}</p>}
        </div>
        <div className="my-6 flex items-center gap-3">
          <Switch id="meta-enabled" checked={false} disabled aria-describedby="activation-help" />
          <label htmlFor="meta-enabled" className="text-sm">Suivi Meta Pixel — désactivé</label>
        </div>
        <p id="activation-help" className="mb-5 text-sm text-muted-foreground">L’activation est verrouillée tant que l’éligibilité et le consentement publicitaire ne sont pas vérifiés.</p>
        <Button type="submit" disabled={saving || pixelId.trim() === settings.pixel_id}><Save />{saving ? "Enregistrement…" : "Enregistrer"}</Button>
      </form>

      <section className="border-b border-border py-8">
        <h2 className="mb-4 text-xl">Créer votre Pixel dans Meta</h2>
        <p className="mb-4 text-sm leading-relaxed">« Connecter à Meta » ouvre Events Manager : ce bouton n’autorise pas de connexion à votre compte. Enregistrer un identifiant ne connecte pas un compte Meta.</p>
        <ol className="list-decimal space-y-3 ps-5 text-sm leading-relaxed">
          <li>Connectez-vous à Meta Events Manager et sélectionnez le portefeuille professionnel de ORRÉA.</li>
          <li>Choisissez « Connecter des sources de données », puis « Web ». Créez un Pixel ou un jeu de données si vous n’en avez pas ; les intitulés peuvent varier.</li>
          <li>Ouvrez la source créée, puis « Paramètres ». Copiez l’identifiant du Pixel et enregistrez-le ci-dessus.</li>
          <li>Dans Events Manager, vérifiez la catégorie du site, les restrictions du jeu de données et les événements autorisés pour ce catalogue. Ne contournez pas une restriction en renommant les produits ou les événements.</li>
          <li>Avant activation, choisissez la gestion du consentement et consultez les <a className="underline underline-offset-4" href="https://www.facebook.com/legal/technology_terms" target="_blank" rel="noopener noreferrer">Conditions des outils professionnels Meta</a>. La politique de confidentialité devra préciser les données partagées et le retrait du consentement.</li>
        </ol>
      </section>

      <section className="border-b border-border py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Diagnostic</h2>
          <Button variant="outline" onClick={diagnose}><RefreshCw />Actualiser</Button>
        </div>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Identifiant enregistré</dt><dd className="mt-1 break-all font-medium">{settings.pixel_id || "Non configuré"}</dd></div>
          <div><dt className="text-muted-foreground">Suivi publicitaire</dt><dd className="mt-1 font-medium">Désactivé — activation bloquée</dd></div>
          <div><dt className="text-muted-foreground">Script Meta sur cette page administrateur</dt><dd className="mt-1 font-medium">{baseDetected === null ? "Vérification…" : baseDetected ? "Script externe détecté — installation à examiner" : "Non chargé"}</dd></div>
          <div><dt className="text-muted-foreground">Réception dans Meta</dt><dd className="mt-1 font-medium">Non vérifiée — aucun événement test envoyé</dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">{checkedAt && `Contrôle local à ${checkedAt}. `}Ce contrôle concerne uniquement cette page ; il ne prouve ni le suivi du site publié ni la réception dans Meta.</p>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-xl">Événements demandés — non installés</h2>
        <div className="divide-y divide-border">
          {metaEvents.map((event) => <div key={event.name} className="grid gap-1 py-4 text-sm sm:grid-cols-[160px_1fr]"><span className="font-medium">{event.name}</span><p className="leading-relaxed text-muted-foreground">{event.action} <span className="text-foreground">En attente d’éligibilité.</span></p></div>)}
        </div>
        <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Réglages réservés aux administrateurs. Aucun identifiant client, formulaire de commande, jeton Meta ou mot de passe n’est transmis. Une éventuelle activation devra conserver les preuves du consentement et permettre son retrait.</p>
      </section>
    </div>
  );
}