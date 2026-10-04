import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-16 md:px-10 animate-rise">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-4 text-[2rem] leading-tight md:text-[2.9rem]">{title}</h1>
      <div className="mt-12 space-y-8 leading-relaxed text-muted-foreground [&_h2]:text-2xl [&_h2]:text-foreground">{children}</div>
    </div>
  );
}
