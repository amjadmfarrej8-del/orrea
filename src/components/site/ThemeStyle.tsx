import { useQuery } from "@tanstack/react-query";
import { settingsQuery, type Theme } from "@/lib/settings";

const hex = /^#[0-9a-fA-F]{3,8}$/;
const fontOk = /^[A-Za-z0-9 ]{2,40}$/;

export function themeCss(t: Theme) {
  const c = (v: string, fb: string) => (hex.test(v) ? v : fb);
  const r = Math.max(0, Math.min(24, Number(t.radius) || 0));
  const display = fontOk.test(t.display_font) ? t.display_font : "Cormorant Garamond";
  const body = fontOk.test(t.body_font) ? t.body_font : "Jost";
  return `:root{--ink:${c(t.foreground, "#F5F5F5")};--background:${c(t.background, "#080808")};--foreground:${c(t.foreground, "#F5F5F5")};--card:${c(t.secondary, "#141414")};--card-foreground:${c(t.foreground, "#F5F5F5")};--primary:${c(t.primary, "#FF6500")};--primary-hover:${c(t.primary_hover, "#E85500")};--primary-foreground:${c(t.background, "#080808")};--secondary:${c(t.secondary, "#141414")};--accent:${c(t.accent, "#252525")};--champagne:${c(t.champagne, "#FF6500")};--muted-foreground:color-mix(in oklab,${c(t.foreground, "#F5F5F5")} 76%,${c(t.background, "#080808")});--border:color-mix(in oklab,${c(t.foreground, "#F5F5F5")} 18%,${c(t.background, "#080808")});--input:color-mix(in oklab,${c(t.foreground, "#F5F5F5")} 28%,${c(t.background, "#080808")});--popover:${c(t.secondary, "#141414")};--popover-foreground:${c(t.foreground, "#F5F5F5")};--secondary-foreground:${c(t.foreground, "#F5F5F5")};--muted:${c(t.secondary, "#141414")};--accent-foreground:${c(t.foreground, "#F5F5F5")};--radius:${r}px;--font-display:"${display}","Tajawal",serif;--font-sans:"${body}","Tajawal",system-ui,sans-serif;}`;
}

export function fontHref(t: Theme) {
  const fams = [t.display_font, t.body_font].filter((f) => fontOk.test(f)).map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600`);
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&family=Tajawal:wght@400;500;700&display=swap`;
}

export function ThemeStyle() {
  const { data } = useQuery(settingsQuery);
  if (!data) return null;
  return (
    <>
      <link rel="stylesheet" href={fontHref(data.theme)} />
      <style dangerouslySetInnerHTML={{ __html: themeCss(data.theme) }} />
    </>
  );
}
