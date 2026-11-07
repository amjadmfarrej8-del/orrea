# ORRÉA — existing Google Sheets integration on Vercel

## Changes made

- Explicit Nitro `vercel` output in `vite.config.ts`. Lovable's build wrapper retains its managed target.
- Shared callback construction for the status page and Google authorization request. Removed the obsolete THÉRAVÉN callback suggestion.
- Optional Vercel-only `GOOGLE_OAUTH_ORIGIN` for deployments whose incoming request URL uses an internal host. Without it, the current request origin is used. Untrusted forwarded production hosts are ignored.
- Database configuration errors are reported rather than mistaken for a disconnected Google account.
- No credential rotation, data deletion, checkout changes, order calculation changes, sync algorithm changes or design changes.

## Vercel settings

Use the existing repository, project root, Node.js 22, `bun install --frozen-lockfile` and `bun run build`.
Deploy the Nitro-generated `.vercel/output` using Vercel's Build Output API; do not override the output to `dist/client` or another static folder, and do not add a catch-all rewrite to `index.html`. The OAuth callback and server functions require live server execution.
Enable Vercel system environment variables. Configure the following for Production, and separately for Preview if needed, then redeploy.

| Exact variable name | Where read | Required value / purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser, build time | Existing public backend URL from the project's generated configuration; do not change backend when preserving connections. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser, build time | Existing public publishable key. |
| `SUPABASE_URL` | Server runtime | Same existing backend URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Server runtime | Same public publishable key; required for administrator session verification. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server runtime only | Privileged credential required by the existing server implementation to read encrypted Google credentials and perform sync. See the critical limitation below. |
| `GOOGLE_TOKEN_ENC_KEY` | Server runtime only | **Exactly the existing encryption key** used to encrypt Google credentials in the database, not a new key. See the limitation below. |
| `GOOGLE_OAUTH_ORIGIN` | Server runtime only, optional | The exact HTTPS origin of the Vercel site, with no path, query, credentials or fragment. Use the same origin from which the administrator opens the Google popup. Leave unset when the request origin is correct. |
| `LOVABLE_API_KEY` | Server runtime only, managed fallback only | Needed only if using the existing legacy managed Sheets connector fallback. Not needed for the direct Google OAuth connection. |
| `GOOGLE_SHEETS_API_KEY` | Server runtime only, managed fallback only | Existing gateway connection credential; not a Google API key. Only required with `LOVABLE_API_KEY` for that fallback. |

`VERCEL`, `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are Vercel system variables; do not invent their values. Do not set `LOVABLE_NITRO_PRESET` on Vercel.

The Google client ID, encrypted client secret, refresh token, destination spreadsheet, selected tab and synchronization ledger remain in the existing database. This implementation does **not** read `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` or `GOOGLE_REDIRECT_URI` environment variables. Do not add those as a substitute for existing records.

### Critical limitation: managed credentials are not exportable

Lovable Cloud does not expose its service-role credential for copying to Vercel. Managed secrets cannot be obtained by printing them, exposing them through an API or copying them into source. Therefore the existing privileged server implementation cannot be declared production-ready on Vercel merely by listing these variable names. A secure, supported provisioning path for the privileged backend access and the identical existing encryption key is still required. Do not use a public key in place of the service-role key, invent a credential, rotate the encryption key, or reconnect Google to conceal this blocker.

No Vercel production URL, deployment logs or production environment settings were supplied, so those settings have not been inspected or changed.

## Google external configuration

The existing integration uses direct Google OAuth, not the App User Connector OAuth gateway.

1. In the **existing** Google Cloud project, keep Google Sheets API and Google Drive API enabled.
2. In Google Auth Platform → Clients → the existing Web application client, **add**, without removing existing entries:
   - `https://orrea.lovable.app/api/public/google-oauth/callback`
   - `https://YOUR-EXACT-VERCEL-HOST/api/public/google-oauth/callback` — replace the host with the real production host, not this example.
   - The corresponding custom-domain callback if that is where the administrator connects Google.
3. The exact active callback is displayed on the admin Google Sheets configuration page. Google's authorization and token exchange must use the identical URI. Start Google connection from the same host to which Google returns; the popup accepts only same-origin messages.
4. Vercel preview deployments have different hosts; add each exact callback when testing there or connect only from a stable production host. Google does not accept wildcard callback hosts.
5. For an External OAuth app, move from Testing to Production to avoid seven-day refresh-token expiry, or use Internal only when every connecting account belongs to the applicable Google Workspace organization. While testing, ensure the administrator is a test user. Google may require verification for the requested scopes.
6. Keep the existing requested scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/spreadsheets`, `https://www.googleapis.com/auth/drive.metadata.readonly`.

No extra CORS configuration or Sheets-specific JavaScript origin is required: Google API requests run server-side. The application's normal sign-in redirect allowlist is a separate setting from this Sheets callback.

## Acceptance checks after secure provisioning and deployment

1. Visit the exact Vercel production host and sign in as an existing administrator.
2. Open `/admin/sheets`; status must load without missing runtime-variable or missing database-configuration errors.
3. Check that the existing account, spreadsheet, tab and synchronization activation remain visible. Do not save new client credentials or reconnect an already healthy connection just to test migration.
4. Load the spreadsheet and its tabs. When direct OAuth is in use, verify the file list as well.
5. If connection is genuinely missing, complete Google consent from that same production host and verify success returns to the opener. Existing reconnection behavior resets the selected destination; do not reconnect merely for a deployment test.
6. The existing “Tester la connexion” action writes a real test row; use it only knowingly. It should succeed with the existing three columns.
7. With synchronization already active, place a real valid order through the unchanged checkout, confirm it exists in admin, then read its name, phone and full address back from the spreadsheet. Verify the ledger reports `synced` and Lovable still reads the same configuration.

## Verification limits and unchanged sync behavior

Callback origin regression tests are included in `src/test/google-oauth-origin.test.ts`.
The existing checkout starts synchronization from a browser request; this compatibility fix does not introduce scheduled processing, rebuild the integration, or change order handling. Existing 200-order batching and append/ledger recovery limitations remain separate from hosting compatibility.
Full Google consent, spreadsheet reads and order writes on Vercel remain unverified until the production host and secure runtime dependencies are available. An empty or signed-out page is not proof of successful synchronization.