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

/** Center-crops an image file to the given width/height ratio. */
async function cropFile(file: File, ratio: number): Promise<File> {
  const bmp = await createImageBitmap(file);
  let w = bmp.width, h = Math.round(w / ratio);
  if (h > bmp.height) { h = bmp.height; w = Math.round(h * ratio); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - w) / 2, (bmp.height - h) / 2, w, h, 0, 0, w, h);
  const blob = await new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error("Recadrage impossible"))), "image/jpeg", 0.9));
  return new File([blob], "image.jpg", { type: "image/jpeg" });
}

export function ImageUpload({ value, onChange, label = "Image", crop }: { value: string; onChange: (url: string) => void; label?: string; crop?: number }) {
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
                onChange(await uploadMedia(crop ? await cropFile(f, crop) : f));
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
  return <span className={`border px-2 py-1 text-[0.8rem] tracking-[0.15em] uppercase ${statusTone[status] ?? "bg-secondary border-border"}`}>{status}</span>;
}
