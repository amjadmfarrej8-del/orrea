export const GOOGLE_CALLBACK_PATH = "/api/public/google-oauth/callback";

type HostingEnvironment = {
  VERCEL?: string | undefined;
  GOOGLE_OAUTH_ORIGIN?: string | undefined;
  VERCEL_URL?: string | undefined;
  VERCEL_PROJECT_PRODUCTION_URL?: string | undefined;
};

/** Keep redirects on the deployment that opened Google; never trust arbitrary forwarded hosts. */
export function googleCallbackUrl(request: Request, env: HostingEnvironment = {}): string {
  const url = new URL(request.url);
  if (env.VERCEL === "1" && env.GOOGLE_OAUTH_ORIGIN) {
    const configured = new URL(env.GOOGLE_OAUTH_ORIGIN);
    if (configured.protocol !== "https:" || configured.username || configured.password || configured.pathname !== "/" || configured.search || configured.hash) {
      throw new Error("GOOGLE_OAUTH_ORIGIN doit être une origine HTTPS sans chemin.");
    }
    return `${configured.origin}${GOOGLE_CALLBACK_PATH}`;
  }
  const forwarded = request.headers.get("x-forwarded-host");
  if (url.hostname === "localhost" && forwarded) {
    // Lovable's localhost rewrite sanitizes this header. On Vercel accept only its known deployment hosts.
    const trusted = env.VERCEL !== "1" || [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL].includes(forwarded);
    if (trusted && /^[a-z0-9.-]+(?::\d+)?$/i.test(forwarded)) return `https://${forwarded}${GOOGLE_CALLBACK_PATH}`;
  }
  return `${url.origin}${GOOGLE_CALLBACK_PATH}`;
}