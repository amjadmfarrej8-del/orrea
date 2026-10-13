import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  const { label, type = "text", ...rest } = props;
  const { L } = useI18n();
  const id = useId();
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);
  const refocus = useRef(false);

  // The browser wipes an input's text when its type flips, so the field is
  // re-created instead; keep the caret where the user left it.
  useLayoutEffect(() => {
    if (refocus.current && ref.current) {
      const len = ref.current.value.length;
      ref.current.focus();
      ref.current.setSelectionRange(len, len);
      refocus.current = false;
    }
  }, [revealed]);

  return (
    <div className="relative">
      <label className="block" htmlFor={id}>
        <span className="eyebrow">{label}</span>
        <input
          {...rest}
          key={isPassword ? (revealed ? "shown" : "hidden") : "plain"}
          ref={ref}
          id={id}
          type={isPassword ? (revealed ? "text" : "password") : type}
          className={`field-lux${isPassword ? " pe-9" : ""}`}
        />
      </label>
      {isPassword && (
        <button
          type="button"
          onClick={() => {
            refocus.current = document.activeElement === ref.current;
            setRevealed((v) => !v);
          }}
          aria-pressed={revealed}
          aria-label={revealed ? L("Masquer le mot de passe", "إخفاء كلمة المرور") : L("Afficher le mot de passe", "إظهار كلمة المرور")}
          title={revealed ? L("Masquer le mot de passe", "إخفاء كلمة المرور") : L("Afficher le mot de passe", "إظهار كلمة المرور")}
          className="absolute end-0 inset-y-0 flex w-9 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
        >
          {revealed ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
        </button>
      )}
    </div>
  );
}
