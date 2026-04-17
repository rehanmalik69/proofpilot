import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold tracking-[-0.01em] text-slate-950">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[13px] leading-6 text-slate-500">{hint}</p> : null}
    </div>
  );
}
