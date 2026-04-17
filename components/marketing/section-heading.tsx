import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  label: string;
  title: string;
  description: string;
  align?: "left" | "center";
  inverse?: boolean;
  className?: string;
};

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
  inverse = false,
  className,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={cn("flex max-w-3xl flex-col gap-4", alignment, className)}>
      <div
        className={cn(
          "inline-flex rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.28em]",
          inverse
            ? "border-white/12 bg-white/8 text-slate-300"
            : "border-blue-200 bg-blue-50 text-blue-700",
        )}
      >
        {label}
      </div>
      <h2
        className={cn(
          "text-3xl font-semibold tracking-[-0.05em] sm:text-4xl lg:text-5xl",
          inverse ? "text-white" : "text-slate-950",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "max-w-2xl text-base leading-8 sm:text-lg",
          inverse ? "text-slate-300" : "text-slate-600",
        )}
      >
        {description}
      </p>
    </div>
  );
}
