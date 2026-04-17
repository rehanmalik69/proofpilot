import { Inbox } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface rounded-[2rem] border border-white/80 px-6 py-12 text-center sm:px-8 sm:py-14",
        className,
      )}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
        <Inbox className="size-6" />
      </div>
      <h2 className="mt-5 text-[1.85rem] font-semibold leading-tight tracking-[-0.03em] text-slate-950">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-6 w-full sm:w-auto">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
