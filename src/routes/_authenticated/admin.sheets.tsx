import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CircleOff, Copy, FileSpreadsheet, KeyRound, LogIn, PlugZap, RefreshCw, Search, Unplug, UserRound } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/seo";
import { GOOGLE_POPUP_TIMEOUT_MS } from "@/lib/sheets-state";
import { Button } from "@/components/ui/button";
import { callSheets, sheetsApiOrigin } from "@/lib/sheets-client";

export const Route = createFileRoute("/_authenticated/admin/sheets")({ staticData: { sitemap: false },
  head: () => pageHead({ path: "/admin/sheets", title: "Google Sheets — Administration ORRÉA", description: "Connexion Google Sheets et synchronisation des commandes ORRÉA.", noindex: true }),
  component: AdminSheets,
});

const inputCls =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50";
const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca" }) : "—";
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function AdminSheets() {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [editCreds, setEditCreds] = useState(false);
  const [files, setFiles] = useState<{ id: string; name: string }[] | null>(null);

  const { data: st, isLoading, error: statusError, refetch } = useQuery({ queryKey: ["sheets-status"], queryFn: () => callSheets("status"), retry: false });
  const refresh = () => qc.invalidateQueries({ queryKey: ["sheets-status"] });

  const [url, setUrl] = useState("");
  const [file, setFile] = useState<{ spreadsheetId: string; title: string; tabs: string[] } | null>(null);
  const [tab, setTab] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const cfg = st?.config;
  const linked = !!st?.linked;
  const configured = !!cfg?.spreadsheet_id && !!cfg?.sheet_name;

  useEffect(() => {
    if (cfg?.spreadsheet_id && !url) setUrl(`https://docs.google.com/spreadsheets/d/${cfg.spreadsheet_id}`);
  }, [cfg?.spreadsheet_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); refresh(); }
  };

  const onLoad = () => run("load", async () => {
    const r = await callSheets("load-spreadsheet", { url });
    setFile(r);
    const savedTab = cfg?.sheet_name;
    setTab(savedTab && r.tabs.includes(savedTab) ? savedTab : r.tabs[0] ?? "");
    toast.success(`Fichier trouvé : ${r.title}`);
  });
  const onSave = () => run("save", async () => {
    if (!file) return;
    await callSheets("save-config", { spreadsheetId: file.spreadsheetId, title: file.title, sheetName: tab });
    toast.success("Fichier et onglet enregistrés. Testez maintenant la connexion.");
  });
  const onTest = () => run("test", async () => {
    const r = await callSheets("test");
    if (r.ok) toast.success("Connexion réussie : une ligne test a été ajoutée à votre feuille.");
    else toast.error(`Erreur de connexion : ${r.error}`);
  });
  const onToggle = () => run("toggle", async () => {
    await callSheets("set-sync", { enabled: !cfg?.enabled });
    toast.success(cfg?.enabled ? "Synchronisation désactivée." : "Synchronisation activée : les nouvelles commandes seront envoyées.");
  });
  const onNow = () => run("now", async () => {
    const r = await callSheets("sync-now");
    toast.success(r.sent ? `${r.sent} commande(s) envoyée(s).` : "Tout est déjà à jour.");
  });
  const onDisc = () => run("disc", async () => {
    if (!confirm("Déconnecter le fichier Google Sheets ? La boutique continuera de fonctionner normalement.")) return;
    await callSheets("disconnect");
    setFile(null); setTab(""); setUrl("");
    toast.success("Google Sheets déconnecté.");
  });

  const own = st?.mode === "own";
  const onSaveClient = () => run("client", async () => {
    await callSheets("save-oauth-client", { clientId, clientSecret });
    setClientSecret(""); setEditCreds(false);
    toast.success("Identifiants Google enregistrés. Connectez maintenant votre compte Google.");
  });
  const onConnectGoogle = () => {
    const popup = window.open("", "google-oauth", "width=520,height=680");
    if (!popup) { toast.error("Autorisez les fenêtres pop-up puis réessayez."); return; }
    void run("connect", async () => {
      try {
        const { authorizationUrl } = await callSheets("start-oauth");
        const apiOrigin = sheetsApiOrigin();
        const callback = new URL(authorizationUrl).searchParams.get("redirect_uri");
        if (!callback || new URL(callback).origin !== apiOrigin) throw new Error("L'adresse de retour Google ne correspond pas au service sécurisé. Vérifiez la configuration de cette adresse.");
        const done = new Promise<"message" | "closed">((resolve, reject) => {
          const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Connexion Google expirée. Réessayez.")); }, GOOGLE_POPUP_TIMEOUT_MS);
          const iv = window.setInterval(() => { if (popup.closed) { cleanup(); resolve("closed"); } }, 600);
          const onMsg = (e: MessageEvent) => {
            if (e.origin !== apiOrigin || e.source !== popup) return;
            if (e.data?.type === "googleSheetsOAuthComplete") { cleanup(); resolve("message"); }
            else if (e.data?.type === "googleSheetsOAuthFailed") { cleanup(); reject(new Error(e.data.message)); }
          };
          const cleanup = () => { window.clearTimeout(timeout); window.clearInterval(iv); window.removeEventListener("message", onMsg); };
          window.addEventListener("message", onMsg);
        });
        popup.location.href = authorizationUrl;
        if ((await done) === "closed") {
          // The window can close before its message arrives; trust only the server-side state.
          const after = await callSheets("status");
          if (after.mode !== "own") throw new Error("Fenêtre Google fermée avant la fin.");
        }
        setFile(null); setFiles(null); setTab(""); setUrl("");
        toast.success("Compte Google connecté ✓");
      } catch (e) { popup.close(); throw e; }
    });
  };
  const onDiscAccount = () => run("discacc", async () => {
    if (!confirm("Déconnecter ce compte Google ? La boutique continuera de fonctionner normalement.")) return;
    await callSheets("disconnect-google"); setFiles(null); setFile(null);
    toast.success("Compte Google déconnecté.");
  });
  const onList = () => run("list", async () => {
    const r = await callSheets("list-spreadsheets");
    setFiles(r.files);
    if (!r.files.length) toast.info("Aucun fichier Google Sheets trouvé sur ce compte.");
  });
  const onPick = (id: string) => run("tabs", async () => {
    if (!id) return;
    const r = await callSheets("spreadsheet-tabs", { spreadsheetId: id });
    setFile(r);
    const savedTab = cfg?.sheet_name;
    setTab(savedTab && r.tabs.includes(savedTab) ? savedTab : r.tabs[0] ?? "");
  });
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); toast.success("Copié"); }
    catch { toast.error("Copie indisponible. Sélectionnez et copiez l'adresse affichée."); }
  };

  const connected = linked && configured && cfg?.last_test_ok === true;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-medium">Google Sheets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Envoyez automatiquement vos commandes vers un fichier Google Sheets (Nom complet, Numéro de téléphone, Adresse complète).
        Cette fonctionnalité est optionnelle : la boutique fonctionne normalement sans connexion.
      </p>

      {statusError && (
        <div role="alert" className="mt-6 border border-destructive p-4 text-sm">
          <p>Impossible de charger Google Sheets : {errMsg(statusError)}</p>
          <Button variant="outline" className="mt-3" onClick={() => void refetch()}><RefreshCw className="me-2 h-4 w-4" /> Réessayer</Button>
        </div>
      )}
      {st && !st.encKeyReady && <p role="alert" className="mt-4 text-sm text-destructive">La clé de chiffrement existante est indisponible sur ce site. Rétablissez-la sans la remplacer.</p>}

      {/* Statut */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-5">
        <div className="flex items-center gap-3">
          {connected ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <CircleOff className="h-5 w-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Statut : {isLoading ? "…" : statusError ? "Indisponible" : connected ? "Connecté" : "Non connecté"}</p>
            <p className="text-xs text-muted-foreground">
              {statusError ? "Le statut de la connexion ne peut pas être vérifié." : !linked ? "Aucun compte Google n'est connecté."
                : !configured ? `Compte Google connecté ✓${st?.googleEmail ? ` (${st.googleEmail})` : ""} — choisissez votre fichier et votre onglet.`
                : cfg?.last_test_ok ? `Envoi vers « ${cfg.spreadsheet_title} » › ${cfg.sheet_name}`
                : "Fichier choisi — testez la connexion."}
            </p>
          </div>
        </div>
        {configured && (
          <button onClick={onDisc} disabled={!!busy} className="btn-lux !px-4 !py-2 text-xs">
            <Unplug className="me-1.5 inline h-3.5 w-3.5" /> Retirer le fichier
          </button>
        )}
      </div>

      {/* Identifiants Google (une seule fois) */}
      {st && (!st.oauthReady || editCreds) ? (
        <div className="mt-6 border border-border bg-background p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <KeyRound className="h-4 w-4" /> Configuration Google requise (une seule fois)
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
            <li>Ouvrez <a className="underline" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Google Cloud › Identifiants</a> et créez (ou choisissez) un projet.</li>
            <li>Dans « Bibliothèque », activez <b>Google Sheets API</b> et <b>Google Drive API</b>.</li>
            <li>« Écran de consentement OAuth » : type <b>Externe</b>, puis ajoutez vos adresses Gmail dans « Utilisateurs test ».</li>
            <li>« Créer des identifiants » › <b>ID client OAuth</b> › type <b>Application Web</b>.</li>
            <li>Dans « URI de redirection autorisés », ajoutez ces adresses :</li>
          </ol>
          <div className="mt-2 space-y-1.5">
            {st.redirectUris.map((u) => (
              <div key={u} className="flex items-center gap-2 border border-border bg-card/60 px-3 py-2 text-xs">
                <code className="flex-1 break-all">{u}</code>
                <button onClick={() => copy(u)} aria-label="Copier"><Copy className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">6. Collez ici l'ID client et le code secret affichés par Google :</p>
          <div className="mt-3 space-y-3">
            <input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
            <input className={inputCls} type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Code secret client (GOCSPX-…)" />
            <div className="flex gap-2">
              <button onClick={onSaveClient} disabled={!clientId || !clientSecret || !st.encKeyReady || !!busy} className="btn-lux flex-1 !py-2.5 text-xs disabled:opacity-50">
                {busy === "client" ? "Enregistrement…" : "Enregistrer les identifiants"}
              </button>
              {editCreds && <button onClick={() => setEditCreds(false)} className="text-xs underline">Annuler</button>}
            </div>
            <p className="text-xs text-muted-foreground">Le code secret est chiffré et conservé côté serveur ; il n'est jamais renvoyé au navigateur.</p>
          </div>
        </div>
      ) : null}

      {/* Compte Google */}
      <div className="mt-6 border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
          <UserRound className="h-4 w-4" /> Compte Google
        </h2>
        <p className="mt-3 text-sm">
          {own ? <>Connecté : <b>{st?.googleEmail ?? "compte Google"}</b></>
            : st?.mode === "managed" ? "Connexion Lovable active (ancienne méthode). Connectez votre propre compte pour gérer tout depuis ici."
            : "Aucun compte Google connecté."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onConnectGoogle} disabled={!st?.oauthReady || !!busy} className="btn-lux !px-4 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">
            <LogIn className="me-1.5 inline h-3.5 w-3.5" /> {busy === "connect" ? "Connexion…" : own ? "Changer de compte Google" : "Connecter un compte Google"}
          </button>
          {own && (
            <button onClick={onDiscAccount} disabled={!!busy} className="btn-lux !px-4 !py-2 text-xs">
              <Unplug className="me-1.5 inline h-3.5 w-3.5" /> Déconnecter le compte
            </button>
          )}
          {st?.oauthReady && !editCreds && (
            <button onClick={() => { setEditCreds(true); setClientId(st.oauthClientId ?? ""); }} className="text-xs underline">Modifier les identifiants Google</button>
          )}
        </div>
        {!st?.oauthReady && st && <p className="mt-2 text-xs text-muted-foreground">Complétez d'abord la configuration Google ci-dessus.</p>}
      </div>

      {/* Configuration */}
      <div className="mt-6 border border-border bg-background p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">Configuration</h2>
        <div className="mt-4 space-y-4">
          {own ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium">Fichier Google Sheets</label>
              {files === null ? (
                <button onClick={onList} disabled={!!busy} className="btn-lux w-full !py-2.5 text-xs">
                  <FileSpreadsheet className="me-1.5 inline h-3.5 w-3.5" /> {busy === "list" ? "Chargement…" : "Choisir un fichier Google Sheets"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <select className={inputCls} value={file?.spreadsheetId ?? ""} onChange={(e) => onPick(e.target.value)}>
                    <option value="">{files.length ? "Sélectionnez un fichier…" : "Aucun fichier trouvé"}</option>
                    {files.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <button onClick={onList} disabled={!!busy} className="btn-lux shrink-0 !px-3 !py-2 text-xs" aria-label="Actualiser la liste">
                    <RefreshCw className={`h-3.5 w-3.5 ${busy === "list" ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
              {(file || cfg?.spreadsheet_title) && (
                <p className="mt-1.5 text-xs text-muted-foreground">Fichier : {file?.title ?? cfg?.spreadsheet_title}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium">Fichier Google Sheets (lien du fichier)</label>
              <div className="flex gap-2">
                <input className={inputCls} disabled={!linked} value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…" />
                <button onClick={onLoad} disabled={!linked || !url || !!busy} className="btn-lux shrink-0 !px-4 !py-2 text-xs disabled:opacity-50">
                  <Search className="me-1 inline h-3.5 w-3.5" /> {busy === "load" ? "…" : "Charger"}
                </button>
              </div>
              {(file || cfg?.spreadsheet_title) && (
                <p className="mt-1.5 text-xs text-muted-foreground">Fichier : {file?.title ?? cfg?.spreadsheet_title}</p>
              )}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium">Onglet de destination</label>
            <select className={inputCls} disabled={!file} value={tab} onChange={(e) => setTab(e.target.value)}>
              {!file && <option>{cfg?.sheet_name ?? "Chargez d'abord un fichier…"}</option>}
              {file?.tabs.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {file && (
            <button onClick={onSave} disabled={!tab || !!busy} className="btn-lux w-full !py-2.5 text-xs disabled:opacity-50">
              {busy === "save" ? "Enregistrement…" : "Enregistrer la configuration"}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={onTest} disabled={!linked || !configured || !!busy} className="btn-lux !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className="me-1.5 inline h-3.5 w-3.5" /> {busy === "test" ? "Test en cours…" : "Tester la connexion"}
        </button>
        <button onClick={onToggle} disabled={!connected || !!busy} className="btn-lux !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
          <PlugZap className="me-1.5 inline h-3.5 w-3.5" /> {cfg?.enabled ? "Désactiver la synchronisation" : "Activer la synchronisation"}
        </button>
      </div>
      {cfg?.last_test_at && (
        <p className={`mt-2 text-xs ${cfg.last_test_ok ? "text-green-700" : "text-destructive"}`}>
          {cfg.last_test_ok ? "🟢 Connexion réussie" : "🔴 Erreur de connexion"} — {fmt(cfg.last_test_at)}
        </p>
      )}

      {/* Dernière synchronisation */}
      <div className="mt-6 border border-border bg-background p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">Dernière synchronisation</h2>
          <button onClick={onNow} disabled={!cfg?.enabled || !!busy} className="text-xs underline disabled:opacity-40">
            {busy === "now" ? "…" : "Synchroniser maintenant"}
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">Synchronisation</dt><dd>{cfg?.enabled ? "Active" : "Inactive"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Commandes envoyées</dt><dd>{st?.synced ?? 0}</dd></div>
          <div><dt className="text-xs text-muted-foreground">En erreur</dt><dd>{st?.errors ?? 0}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">Dernier envoi : {fmt(cfg?.last_sync_at)}</p>
        {cfg?.last_error && (
          <p className="mt-2 flex gap-1.5 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {cfg.last_error}</p>
        )}
      </div>
    </div>
  );
}
