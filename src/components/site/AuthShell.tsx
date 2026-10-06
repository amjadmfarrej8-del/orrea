import type { ReactNode } from "react";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-5 py-20 animate-rise">
      <p className="eyebrow text-center">THÉRAVÈNE</p>
      <h1 className="mt-4 text-center text-[2rem] leading-tight md:text-[2.9rem]">{title}</h1>
      <div className="mt-12">{children}</div>
    </div>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input {...rest} className="field-lux" />
    </label>
  );
}
