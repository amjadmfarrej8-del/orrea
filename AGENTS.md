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
