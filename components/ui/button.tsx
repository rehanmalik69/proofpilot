import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-blue-500/40 bg-[linear-gradient(135deg,#2563eb_0%,#0f172a_100%)] text-white shadow-[0_18px_40px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 hover:border-blue-400/60 hover:shadow-[0_24px_55px_rgba(37,99,235,0.28)]",
  secondary:
    "border border-slate-200 bg-white/95 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]",
  ghost: "text-slate-700 hover:bg-slate-900/5",
  destructive:
    "border border-rose-200 bg-rose-50/90 text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)] hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-[0_16px_30px_rgba(244,63,94,0.12)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  href,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
