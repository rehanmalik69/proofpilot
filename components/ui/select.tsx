import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-[1.35rem] border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.03)] outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
