import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const id = useId();
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  // Browsers clear an input's text when its type flips between password and
  // text; put the value back so revealing never wipes what was typed.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !isPassword) return;
    const expected = typeof rest.value === "string" ? rest.value : null;
    if (expected !== null && el.value !== expected) {
      el.value = expected;
      el.setSelectionRange(expected.length, expected.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, isPassword]);

  return (
    <div className="relative">
      <label className="block" htmlFor={id}>
        <span className="eyebrow">{label}</span>
        <input
          {...rest}
          ref={ref}
          id={id}
          type={isPassword ? (revealed ? "text" : "password") : type}
          className={`field-lux${isPassword ? " pe-9" : ""}`}
        />
      </label>
      {isPassword && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-pressed={revealed}
          aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          title={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute end-0 inset-y-0 flex w-9 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
        >
          {revealed ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
        </button>
      )}
    </div>
  );
}
