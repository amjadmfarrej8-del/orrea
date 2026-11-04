// Central SEO helper: every public page builds its head tags here so canonical,
// og:url, hreflang and social tags stay consistent and self-referencing.
export const SITE_URL = "https://orrea.lovable.app";
export const SITE_NAME = "ORRÉA";

type Opts = { path: string; title: string; description: string; image?: string | undefined; type?: string; noindex?: boolean | undefined };

export function pageHead({ path, title, description, image, type = "website", noindex }: Opts) {
  const url = `${SITE_URL}${path}`;
  const desc = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  return {
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:locale", content: "fr_MA" },
      { property: "og:locale:alternate", content: "ar_MA" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
      ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
    ],
    links: noindex
      ? []
      : [
          { rel: "canonical", href: url },
          { rel: "alternate", hrefLang: "fr-MA", href: url },
          { rel: "alternate", hrefLang: "x-default", href: url },
        ],
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}
