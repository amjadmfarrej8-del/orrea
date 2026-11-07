# ORRÉA — Google Sheets with a Vercel frontend

## Architecture (2026-11-07)

```text
Browser (Vercel or Lovable)
  │  admin session token (or none for the post-order sync)
  ▼
https://orrea.lovable.app/api/public/sheets/<action>   ← hosted on the Lovable runtime
  │  verifies token + admin role, uses managed privileged backend access,
  │  decrypts Google tokens with GOOGLE_TOKEN_ENC_KEY
  ▼
Lovable Cloud database  +  Google Sheets / Drive APIs
```

- All privileged Google Sheets work (status, OAuth client storage, Google sign-in, file listing, test, manual and post-order sync, account disconnect) runs only on the Lovable-hosted runtime. Vercel never needs the service-role credential or the encryption key.
- Administrator actions require `Authorization: Bearer <session token>` and the `admin` role (`has_role`). The only public action, `sync-new-orders`, returns `{ ok, sent }` only.
- CORS allows `*.lovable.app`, `orrea.vercel.app`, `orrea-*.vercel.app`, localhost, plus any HTTPS origins listed in the Lovable secret `SHEETS_ALLOWED_ORIGINS` (comma-separated, e.g. a custom domain).
- The Google redirect URI is always on the Lovable host: `https://orrea.lovable.app/api/public/google-oauth/callback`. The popup notifies the admin page with `{ type, message }` only; the page accepts it only from the endpoint origin and re-checks status server-side.
- No table, order, product, account or credential was migrated or deleted. Never rotate `GOOGLE_TOKEN_ENC_KEY`.

## Vercel environment variables

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Existing public backend URL (unchanged) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Existing public publishable key (unchanged) |
| `VITE_SHEETS_API_ORIGIN` | `https://orrea.lovable.app` |

Remove `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_TOKEN_ENC_KEY` from Vercel if present; they are no longer read there. Redeploy after changing `VITE_*` variables (they are build-time).

## Google Cloud Console

OAuth client → Authorized redirect URIs: `https://orrea.lovable.app/api/public/google-oauth/callback`. The Vercel callback URI is not needed. Scopes unchanged: openid, userinfo.email, spreadsheets, drive.metadata.readonly.

## Lovable

Publish the Lovable project after changes to this endpoint; Vercel calls the published deployment.
