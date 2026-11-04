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
- Clothing options are stored on products and validated again by place_order; selected size/color are immutable order-item snapshots. Unconfirmed prices block ordering. Product-page quick orders use the existing RPC without cart navigation.
- Bilingual content lives in paired `_fr`/`_ar` columns; UI strings in `src/lib/i18n.tsx` (RTL set on <html> for Arabic).
- Product images: `products.image` is a local asset key (see `src/lib/catalog.ts`) or a full URL.
- Per-color name, image and optional HEX stay in products.colors JSON; the admin manager uploads through existing private media storage and validates unique names plus required images so storefront selections remain unambiguous.
- Store config (theme, store contact/shipping, SEO, homepage sections) lives in `site_settings` key/value rows read via `settingsQuery`; theme is applied as CSS variables by `ThemeStyle`.
- Empty remixed stores use complete editable homepage/theme defaults from settings.ts; campaign asset keys resolve through catalog.ts, so the page stays usable before configuration without seeding products.
- Shipping/coupon pricing is computed only by the `quote_order` SQL function, reused by `place_order`.
- Admin access = `admin` row in `user_roles` (checked with `has_role`); first account to sign up is auto-granted admin by the signup trigger.
- Uploaded media goes to the private `media` bucket and is stored as long-lived signed URLs (workspace blocks public buckets).
- Storefront scroll motion is enhanced centrally by ScrollReveal using IntersectionObserver and independent translate/opacity animations on existing nodes; this preserves layout, hover transforms, SSR visibility and admin interactions.
- Meta Pixel configuration is stored in an administrator-only table, not public site_settings; activation is blocked in both application and database until dataset eligibility and advertising consent are verified, to prevent sensitive catalog information reaching Meta.

- Streetwear campaign assets are resolved by catalog keys; the hero uses a dedicated mobile crop and real product gallery slides, keeping navigation functional and homepage configuration editable.
- Raster images are stored as WebP (max 1600px wide) via asset pointers; below-the-fold images use loading="lazy" decoding="async", the first visible photo uses fetchPriority="high" — keeps pages light on mobile.
- Public page head tags are built with `pageHead()` in src/lib/seo.ts and every route declares `staticData.sitemap`; keeps canonical/og:url/hreflang self-referencing and the router-derived /sitemap.xml accurate.
- Product JSON-LD emits an Offer only for confirmed prices; never publish unconfirmed prices to search engines.
- Homme's product row alone uses Embla with auto-scroll; reuse unchanged ProductCard and pause offscreen, on interaction and for reduced motion to keep other collections unchanged and rendering lightweight.
