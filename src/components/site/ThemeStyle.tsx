import { useQuery } from "@tanstack/react-query";
import { settingsQuery, type Theme } from "@/lib/settings";

const hex = /^#[0-9a-fA-F]{3,8}$/;
const fontOk = /^[A-Za-z0-9 ]{2,40}$/;

export function themeCss(t: Theme) {
  const c = (v: string, fb: string) => (hex.test(v) ? v : fb);
  const r = Math.max(0, Math.min(24, Number(t.radius) || 0));
  const display = fontOk.test(t.display_font) ? t.display_font : "Cormorant Garamond";
  const body = fontOk.test(t.body_font) ? t.body_font : "Jost";
  return `:root{--ink:${c(t.foreground, "#14263D")};--background:${c(t.background, "#FFFFFF")};--foreground:${c(t.foreground, "#14263D")};--card:${c(t.secondary, "#F7F9FC")};--card-foreground:${c(t.foreground, "#14263D")};--primary:${c(t.primary, "#14263D")};--primary-hover:${c(t.primary_hover, "#243D58")};--primary-foreground:${c(t.background, "#FFFFFF")};--secondary:${c(t.secondary, "#F7F9FC")};--accent:${c(t.accent, "#E7EDF4")};--champagne:${c(t.champagne, "#64748B")};--muted-foreground:color-mix(in oklab,${c(t.foreground, "#14263D")} 76%,${c(t.background, "#FFFFFF")});--radius:${r}px;--font-display:"${display}","Tajawal",serif;--font-sans:"${body}","Tajawal",system-ui,sans-serif;}`;
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
