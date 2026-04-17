import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3.5 text-sm leading-7 text-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
