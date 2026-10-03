import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/settings";

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

export function AField({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputCls = "w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-border bg-background p-6 ${className}`}>{children}</div>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
      {label}
    </label>
  );
}

export function ImageUpload({ value, onChange, label = "Image" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        {value ? <img src={value.startsWith("http") || value.startsWith("/") ? value : undefined} alt="" className="h-20 w-16 bg-card object-cover" /> : <div className="h-20 w-16 bg-card" />}
        <label className="btn-ghost-lux cursor-pointer !px-4 !py-2">
          {busy ? "…" : "Téléverser"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                onChange(await uploadMedia(f));
              } catch (err) {
                toast.error((err as Error).message);
              }
              setBusy(false);
            }}
          />
        </label>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground link-lux">Retirer</button>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    new: "bg-champagne/30", confirmed: "bg-accent", preparing: "bg-secondary", shipped: "bg-secondary", delivered: "bg-primary text-primary-foreground", cancelled: "bg-destructive/15 text-destructive",
  };
  return <span className={`px-2 py-1 text-[0.62rem] tracking-[0.15em] uppercase ${tone[status] ?? "bg-secondary"}`}>{status}</span>;
}
