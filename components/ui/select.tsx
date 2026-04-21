import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[1.15rem] border border-slate-200 bg-white px-3.5 text-[13px] text-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.03)] outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-[var(--ring)] sm:h-12 sm:rounded-[1.35rem] sm:px-4 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
