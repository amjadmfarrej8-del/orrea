import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, CircleOff, PlugZap, RefreshCw, Search, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  disconnectSheets, getSheetsStatus, loadSpreadsheet, saveSheetsConfig,
  setSheetsSync, syncSheetsNow, testSheetsConnection,
} from "@/lib/sheets.functions";

export const Route = createFileRoute("/_authenticated/admin/sheets")({
  head: () => ({ meta: [{ title: "Google Sheets — Administration THÉRAVÈNE" }, { name: "robots", content: "noindex" }] }),
  component: AdminSheets,
});

const inputCls =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50";
const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca" }) : "—";
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function AdminSheets() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getSheetsStatus);
  const loadFn = useServerFn(loadSpreadsheet);
  const saveFn = useServerFn(saveSheetsConfig);
  const testFn = useServerFn(testSheetsConnection);
  const syncFn = useServerFn(setSheetsSync);
  const nowFn = useServerFn(syncSheetsNow);
  const discFn = useServerFn(disconnectSheets);

  const { data: st, isLoading } = useQuery({ queryKey: ["sheets-status"], queryFn: () => statusFn() });
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
    const r = await loadFn({ data: { url } });
    setFile(r);
    setTab(r.tabs.includes(cfg?.sheet_name ?? "") ? cfg!.sheet_name! : r.tabs[0] ?? "");
    toast.success(`Fichier trouvé : ${r.title}`);
  });
  const onSave = () => run("save", async () => {
    if (!file) return;
    await saveFn({ data: { spreadsheetId: file.spreadsheetId, title: file.title, sheetName: tab } });
    toast.success("Fichier et onglet enregistrés. Testez maintenant la connexion.");
  });
  const onTest = () => run("test", async () => {
    const r = await testFn();
    if (r.ok) toast.success("Connexion réussie : une ligne test a été ajoutée à votre feuille.");
    else toast.error(`Erreur de connexion : ${r.error}`);
  });
  const onToggle = () => run("toggle", async () => {
    await syncFn({ data: { enabled: !cfg?.enabled } });
    toast.success(cfg?.enabled ? "Synchronisation désactivée." : "Synchronisation activée : les nouvelles commandes seront envoyées.");
  });
  const onNow = () => run("now", async () => {
    const r = await nowFn();
    toast.success(r.sent ? `${r.sent} commande(s) envoyée(s).` : "Tout est déjà à jour.");
  });
  const onDisc = () => run("disc", async () => {
    if (!confirm("Déconnecter le fichier Google Sheets ? La boutique continuera de fonctionner normalement.")) return;
    await discFn();
    setFile(null); setTab(""); setUrl("");
    toast.success("Google Sheets déconnecté.");
  });

  const connected = linked && configured && cfg?.last_test_ok === true;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-medium">Google Sheets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Envoyez automatiquement vos commandes vers un fichier Google Sheets (Nom complet, Numéro de téléphone, Adresse complète).
        Cette fonctionnalité est optionnelle : la boutique fonctionne normalement sans connexion.
      </p>

      {/* Statut */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-5">
        <div className="flex items-center gap-3">
          {connected ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <CircleOff className="h-5 w-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Statut : {isLoading ? "…" : connected ? "Connecté" : "Non connecté"}</p>
            <p className="text-xs text-muted-foreground">
              {!linked ? "Aucun compte Google n'est relié."
                : !configured ? "Compte Google relié ✓ — choisissez votre fichier et votre onglet."
                : cfg?.last_test_ok ? `Envoi vers « ${cfg.spreadsheet_title} » › ${cfg.sheet_name}`
                : "Fichier choisi — testez la connexion."}
            </p>
          </div>
        </div>
        {configured && (
          <button onClick={onDisc} disabled={!!busy} className="btn-lux !px-4 !py-2 text-xs">
            <Unplug className="me-1.5 inline h-3.5 w-3.5" /> Déconnecter
          </button>
        )}
      </div>

      {/* Configuration */}
      <div className="mt-6 border border-border bg-background p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">Configuration</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Compte Google</label>
            <input className={inputCls} disabled value={linked ? "Compte Google connecté ✓" : "Non relié"} readOnly />
          </div>
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
          <div>
            <label className="mb-1.5 block text-xs font-medium">Onglet de destination</label>
            <select className={inputCls} disabled={!file} value={tab} onChange={(e) => setTab(e.target.value)}>
              {!file && <option>{cfg?.sheet_name ?? "Chargez d'abord un fichier…"}</option>}
              {file?.tabs.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {file && (
            <button onClick={onSave} disabled={!tab || !!busy} className="btn-lux w-full !py-2.5 text-xs disabled:opacity-50">
              {busy === "save" ? "Enregistrement…" : "Enregistrer le fichier et l'onglet"}
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
