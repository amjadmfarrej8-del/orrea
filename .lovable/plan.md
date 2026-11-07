# Google Sheets : opérations sécurisées hébergées sur Lovable Cloud, appelées depuis Vercel

## Ce que j'ai trouvé (diagnostic)

**Architecture actuelle** : 12 fonctions serveur dans `sheets.functions.ts` + une page de retour Google (callback). Elles s'exécutent sur le serveur qui affiche le site — donc sur Vercel quand le site est sur Vercel.

Opérations qui ont besoin de l'accès privilégié (clé service role) et de la clé de chiffrement :
- État de la connexion, enregistrement du Client ID / secret Google, démarrage de la connexion Google, retour Google (callback)
- Chargement / liste des fichiers et onglets, test d'écriture, synchronisation manuelle
- Synchronisation automatique après chaque commande (publique, appelée par le client)
- Déconnexion du compte Google

Opérations qui n'en ont pas besoin (déjà faites avec les droits de l'admin connecté) : choix du fichier, activation/désactivation, retrait du fichier.

**Cause racine sur Vercel** : Vercel n'a ni la clé service role (non exportable depuis Lovable Cloud) ni la clé de chiffrement → toutes les opérations privilégiées échouent, l'interface semble bloquée.

**État actuel des données** : les tables Google Sheets sont vides (aucun identifiant, aucun compte connecté, aucune commande). Rien ne sera supprimé ; il faudra simplement reconnecter Google une fois après le changement.

**Clé de chiffrement** : `GOOGLE_TOKEN_ENC_KEY` existe bien côté Lovable Cloud.

## Point important sur les « Edge Functions »

Sur ce type de projet, la plateforme n'autorise pas la création de nouvelles Edge Functions. L'équivalent exact est un **point d'accès serveur hébergé par Lovable** (sur `orrea.lovable.app`), qui dispose de la clé service role gérée et de la clé de chiffrement — mêmes garanties de sécurité qu'une Edge Function. C'est ce que je propose.

```text
Navigateur (Vercel ou Lovable)
   │  jeton de session de l'admin (ou rien, pour la synchro après commande)
   ▼
https://orrea.lovable.app/api/public/sheets/<action>   ← hébergé par Lovable Cloud
   │  vérifie le jeton + rôle admin, clé service role, déchiffre les jetons Google
   ▼
Base de données Lovable Cloud  +  API Google Sheets / Drive
```

## Ce qui change

1. **Nouveau point d'accès sécurisé** sur Lovable : une seule adresse `/api/public/sheets/<action>`, qui reprend la logique existante telle quelle (synchro, anti-doublons, chiffrement, test, liste des fichiers).
   - Actions admin : rejet si le jeton de session est absent/invalide ou si l'utilisateur n'est pas admin.
   - Action publique « synchroniser les nouvelles commandes » : ne renvoie que `{ ok, sent }`, aucune donnée.
   - Accès navigateur (CORS) autorisé uniquement depuis votre domaine Vercel et les domaines Lovable.
2. **Page Admin › Google Sheets, commande rapide et checkout** : appellent ce point d'accès au lieu des fonctions serveur actuelles. Même design, mêmes boutons, mêmes messages.
3. **Connexion Google** : l'adresse de retour Google devient toujours `https://orrea.lovable.app/api/public/google-oauth/callback`, quel que soit le site d'où vous cliquez. La fenêtre Google prévient la page Admin (Vercel ou Lovable) à la fin, sans transmettre de jeton.
4. **Vercel n'a plus besoin d'aucun secret** pour Google Sheets.

## Ce qui ne change pas

Tables, commandes, produits, comptes, rôles, clé de chiffrement, design, checkout, calcul des prix. Aucune migration, aucune suppression.

## Configuration à faire après

- **Vercel** : garder `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` ; ajouter `VITE_SHEETS_API_ORIGIN=https://orrea.lovable.app` ; retirer `SUPABASE_SERVICE_ROLE_KEY` et `GOOGLE_TOKEN_ENC_KEY` s'ils y sont.
- **Google Cloud Console** : URI de redirection autorisée = `https://orrea.lovable.app/api/public/google-oauth/callback` (l'URI Vercel n'est plus nécessaire).
- **Publier le site Lovable** après le changement : le point d'accès doit exister sur `orrea.lovable.app`, sinon Vercel ne peut pas l'appeler.
- **J'ai besoin de votre adresse Vercel** (ex. `orrea.vercel.app` ou votre domaine) pour l'autoriser.

## Détails techniques

- `src/lib/sheets-core.server.ts` : déplacement de `runSync`, `sheetsApi`, `ensureHeaders`, `appendRows`, `parseSpreadsheetId` et des handlers (code inchangé) ; `supabaseAdmin` importé dynamiquement dans le handler, jamais côté client.
- `src/routes/api/public/sheets/$action.ts` : `POST` + `OPTIONS`; auth via `Authorization: Bearer` → client utilisateur `getClaims()` → `has_role(admin)` par le client utilisateur ; table d'actions ; liste blanche CORS (domaine Vercel + `*.lovable.app`), `Vary: Origin`, pas de cookies.
- `src/lib/sheets-client.ts` : `callSheets(action, data)` ; origine = `import.meta.env.VITE_SHEETS_API_ORIGIN` sinon `window.location.origin` ; ajoute le jeton de session courant pour les actions admin.
- `googleCallbackUrl()` : priorité à l'origine Lovable publiée ; le callback envoie `postMessage` à `'*'` avec uniquement `{type, message}`, et la page Admin vérifie `event.origin` = origine du point d'accès.
- `sheets.functions.ts` retiré (plus aucun appel) ; `admin.sheets.tsx`, `QuickOrder.tsx`, `checkout.tsx` basculés sur `callSheets`.
- Tests : rejet sans jeton / non-admin, action publique ne renvoie que `ok/sent`, liste blanche CORS, choix de l'origine du callback.
- Mise à jour de `AGENTS.md` (règle Google Sheets) et de `GOOGLE-SHEETS-VERCEL.md`.
