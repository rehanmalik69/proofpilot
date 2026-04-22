import { MailCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Notice } from "@/components/ui/notice";
import type { AuthActionNotice } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type VerificationPanelProps = {
  title: string;
  body: string;
  secondaryLine?: string;
  helperText: string;
  footer?: string;
  note?: string;
  feedback?: AuthActionNotice | null;
  actions: ReactNode;
  className?: string;
};

export function VerificationPanel({
  title,
  body,
  secondaryLine,
  helperText,
  footer,
  note,
  feedback,
  actions,
  className,
}: VerificationPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_18px_45px_rgba(245,158,11,0.08)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200/80 sm:size-12">
          <MailCheck className="size-5 sm:size-[1.375rem]" />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700/80">
              Email verification
            </p>
            <h3 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.85rem]">
              {title}
            </h3>
          </div>
          <p className="text-sm leading-7 text-slate-700">{body}</p>
          {secondaryLine ? (
            <p className="rounded-[1.1rem] border border-white/90 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
              {secondaryLine}
            </p>
          ) : null}
          <p className="text-sm leading-6 text-slate-600">{helperText}</p>
        </div>
      </div>

      {feedback ? (
        <Notice
          className="mt-5"
          tone={feedback.tone}
          message={feedback.message}
          detail={feedback.detail}
        />
      ) : null}

      <div className="mt-6">{actions}</div>
      {footer ? <p className="mt-5 text-sm leading-6 text-slate-600">{footer}</p> : null}
      {note ? <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p> : null}
    </section>
  );
}
