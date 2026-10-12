<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## THÉRAVÉN store
- Orders are created only via the `place_order` security-definer RPC, which re-prices from the DB and decrements stock — never trust client prices.
- Bilingual content lives in paired `_fr`/`_ar` columns; UI strings in `src/lib/i18n.tsx` (RTL set on <html> for Arabic).
- Product images: `products.image` is a local asset key (see `src/lib/catalog.ts`) or a full URL.
- Store config (theme, store contact/shipping, SEO, homepage sections) lives in `site_settings` key/value rows read via `settingsQuery`; theme is applied as CSS variables by `ThemeStyle`.
- Shipping/coupon pricing is computed only by the `quote_order` SQL function, reused by `place_order`.
- Admin access = `admin` row in `user_roles` (checked with `has_role`); first account to sign up is auto-granted admin by the signup trigger.
- Uploaded media goes to the private `media` bucket and is stored as long-lived signed URLs (workspace blocks public buckets).
- Storefront scroll motion is enhanced centrally by ScrollReveal using IntersectionObserver and independent translate/opacity animations on existing nodes; this preserves layout, hover transforms, SSR visibility and admin interactions.
