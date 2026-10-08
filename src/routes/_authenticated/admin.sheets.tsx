import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, CircleOff, Plug, PlugZap, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/sheets")({
  head: () => ({ meta: [{ title: "Google Sheets — Administration THÉRAVÈNE" }, { name: "robots", content: "noindex" }] }),
  component: AdminSheets,
});

const selectCls =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50";

function AdminSheets() {
  // Interface prête — la connexion Google sera branchée plus tard.
  const [connected] = useState(false);
  const [syncEnabled] = useState(false);
  const [lastSync] = useState<string | null>(null);

  const notYet = () =>
    toast.info("Connexion Google non configurée", {
      description: "La connexion Google Sheets sera activée prochainement. Vous pourrez connecter votre compte directement depuis cette page.",
    });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-medium">Google Sheets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Envoyez automatiquement vos commandes vers un fichier Google Sheets. Cette fonctionnalité est optionnelle :
        la boutique fonctionne normalement sans connexion.
      </p>

      {/* Statut */}
      <div className="mt-8 flex items-center justify-between border border-border bg-background p-5">
        <div className="flex items-center gap-3">
          {connected ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <CircleOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Statut : {connected ? "Connecté" : "Non connecté"}</p>
            <p className="text-xs text-muted-foreground">
              {connected ? "Votre compte Google est relié." : "Aucun compte Google n'est relié pour le moment."}
            </p>
          </div>
        </div>
        {connected ? (
          <button onClick={notYet} className="btn-lux !px-4 !py-2 text-xs">
            <Unplug className="me-1.5 inline h-3.5 w-3.5" /> Déconnecter
          </button>
        ) : (
          <button onClick={notYet} className="btn-lux !px-4 !py-2 text-xs">
            <Plug className="me-1.5 inline h-3.5 w-3.5" /> Connecter Google Sheets
          </button>
        )}
      </div>

      {/* Configuration */}
      <div className="mt-6 border border-border bg-background p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">Configuration</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Compte Google</label>
            <select className={selectCls} disabled={!connected} onChange={notYet}>
              <option>{connected ? "Choisir un compte…" : "Connectez d'abord votre compte Google"}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Fichier Google Sheets</label>
            <select className={selectCls} disabled={!connected} onChange={notYet}>
              <option>Choisir un fichier…</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Onglet de destination</label>
            <select className={selectCls} disabled={!connected} onChange={notYet}>
              <option>Choisir un onglet…</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={notYet} disabled={!connected} className="btn-lux !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className="me-1.5 inline h-3.5 w-3.5" /> Tester la connexion
        </button>
        <button onClick={notYet} disabled={!connected} className="btn-lux !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
          <PlugZap className="me-1.5 inline h-3.5 w-3.5" /> {syncEnabled ? "Désactiver la synchronisation" : "Activer la synchronisation"}
        </button>
      </div>

      {/* Dernière synchronisation */}
      <div className="mt-6 border border-border bg-background p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">Dernière synchronisation</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {lastSync ? lastSync : "Aucun envoi pour le moment. Les nouvelles commandes apparaîtront ici une fois la synchronisation active."}
        </p>
      </div>
    </div>
  );
}
