import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "info" | "ghost";
};

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-slate-950 text-white",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  ghost: "border border-slate-200 bg-white text-slate-600",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.005em] sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.01em]",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
