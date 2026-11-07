import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Section } from "@/lib/settings";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), sec: s % 60 };
}

export function CountdownDrop({ sec }: { sec: Section }) {
  const { lang, L } = useI18n();
  const ar = lang === "ar";
  const target = sec.launch_at ? new Date(sec.launch_at).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const live = !Number.isFinite(target) || target <= now;
  const p = live ? { d: 0, h: 0, m: 0, sec: 0 } : parts(target - now);
  const cells = [
    { v: p.d, label: L("Jours", "أيام") },
    { v: p.h, label: L("Heures", "ساعات") },
    { v: p.m, label: L("Minutes", "دقائق") },
    { v: p.sec, label: L("Secondes", "ثوانٍ") },
  ];
  const link = sec.link?.startsWith("/") ? sec.link : "/shop?f=nouveautes";
  return (
    <section className="animate-rise bg-street-black px-5 py-14 text-center md:py-24">
      <p className="mx-auto w-fit border border-cta/60 px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-cta md:text-xs">
        {L("Coming soon", "قريباً")}
      </p>
      <h2 className="streetwear-heading mt-6">{(ar ? sec.title_ar : sec.title_fr) || "NEW DROP"}</h2>
      <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground md:text-sm">
        {(ar ? sec.text_ar : sec.text_fr) || L("A new collection is coming", "مجموعة جديدة قادمة")}
      </p>
      <span className="mx-auto mt-6 block h-px w-16 bg-cta" aria-hidden />
      {live ? (
        <div className="mt-8">
          <p className="text-lg uppercase tracking-[0.25em] text-cta md:text-2xl">{L("The new drop is live", "المجموعة الجديدة متاحة")}</p>
          <a href={link} className="btn-lux mt-6 inline-block">{L("Discover now", "اكتشفوا الآن")}</a>
        </div>
      ) : (
        <div className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-3 md:gap-8" role="timer">
          {cells.map((c, i) => (
            <div key={c.label} className="flex items-start gap-3 md:gap-8">
              {i > 0 && <span className="mt-1 text-2xl font-light text-cta md:mt-3 md:text-5xl" aria-hidden>:</span>}
              <div>
                <p className="text-3xl font-light tabular-nums text-white md:text-6xl">{String(c.v).padStart(2, "0")}</p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-muted-foreground md:text-xs">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
