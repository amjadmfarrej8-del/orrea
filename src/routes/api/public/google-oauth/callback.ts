import { createFileRoute } from "@tanstack/react-router";

// Public Google OAuth callback. Verified by a one-time state stored server-side.
const page = (ok: boolean, msg: string) => {
  const esc = msg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const payload = JSON.stringify({ type: ok ? "googleSheetsOAuthComplete" : "googleSheetsOAuthFailed", message: msg }).replace(/<\//g, "<\\/");
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google</title></head><body style="font-family:sans-serif;padding:2rem"><p>${esc}</p><script>
var m=${payload};if(window.opener&&window.opener!==window){window.opener.postMessage(m,"*");}setTimeout(function(){window.close()},800);
</script></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
};

export const Route = createFileRoute("/api/public/google-oauth/callback")({ staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        if (err) return page(false, `Connexion Google annulée (${err}).`);
        if (!code || !state) return page(false, "Réponse Google incomplète.");
        try {
          const { getAdmin, decrypt, encrypt, exchangeToken } = await import("@/lib/google-oauth.server");
          const admin = await getAdmin();
          const { data: sec } = await admin.from("google_oauth_secrets").select("*").eq("id", 1).single();
          const { data: cfg } = await admin.from("google_sheets_config").select("oauth_client_id").eq("id", 1).single();
          if (!sec?.oauth_state || sec.oauth_state !== state || !sec.oauth_state_expires || new Date(sec.oauth_state_expires) < new Date()) {
            return page(false, "Lien de connexion expiré. Réessayez depuis l'Admin.");
          }
          if (!cfg?.oauth_client_id || !sec.client_secret_enc || !sec.oauth_redirect_uri) return page(false, "Identifiants Google manquants.");
          const { requireSavedRow } = await import("@/lib/sheets-state");
          const consumed = await admin.from("google_oauth_secrets").update({ oauth_state: null, oauth_state_expires: null }).eq("id", 1).eq("oauth_state", state).gt("oauth_state_expires", new Date().toISOString()).select("id").single();
          requireSavedRow(consumed, "Validation de la connexion Google");
          const tok = await exchangeToken({
            grant_type: "authorization_code", code,
            client_id: cfg.oauth_client_id,
            client_secret: await decrypt(sec.client_secret_enc),
            redirect_uri: sec.oauth_redirect_uri,
          });
          if (!tok.refresh_token) return page(false, "Google n'a pas fourni d'accès permanent. Réessayez.");
          let email: string | null = null;
          const ui = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } });
          if (ui.ok) email = ((await ui.json()) as { email?: string }).email ?? null;
          const tokenWrite = await admin.from("google_oauth_secrets").update({ refresh_token_enc: await encrypt(tok.refresh_token), updated_at: new Date().toISOString() }).eq("id", 1).select("id").single();
          requireSavedRow(tokenWrite, "Enregistrement de la connexion Google");
          const configWrite = await admin.from("google_sheets_config").update({
            google_email: email, oauth_connected_at: new Date().toISOString(),
            spreadsheet_id: null, spreadsheet_title: null, sheet_name: null, enabled: false, last_test_ok: null, last_test_at: null,
          }).eq("id", 1).select("id").single();
          requireSavedRow(configWrite, "Enregistrement du compte Google");
          return page(true, "Compte Google connecté. Vous pouvez fermer cette fenêtre.");
        } catch (e) {
          console.error("google oauth callback", e);
          return page(false, e instanceof Error ? e.message : "Erreur de connexion Google.");
        }
      },
    },
  },
});
