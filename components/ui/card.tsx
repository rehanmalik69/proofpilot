import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[2rem] border p-0 transition duration-300", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col p-5 sm:p-7", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-xl", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.14em]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0 sm:p-7 sm:pt-0", className)} {...props} />;
}
