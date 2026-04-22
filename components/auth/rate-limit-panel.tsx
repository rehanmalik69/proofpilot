"use client";

import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIGNUP_RATE_LIMIT_COPY } from "@/lib/constants/auth-messages";

type RateLimitPanelProps = {
  cooldownSeconds: number;
  onTryAgainLater: () => void;
  onUseDifferentEmail: () => void;
};

export function RateLimitPanel({
  cooldownSeconds,
  onTryAgainLater,
  onUseDifferentEmail,
}: RateLimitPanelProps) {
  const isCoolingDown = cooldownSeconds > 0;

  return (
    <section className="mt-8 rounded-[1.75rem] border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_18px_45px_rgba(245,158,11,0.08)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200/80 sm:size-12">
          <Clock3 className="size-5 sm:size-[1.375rem]" />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700/80">
              Signup protection
            </p>
            <h3 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.85rem]">
              {SIGNUP_RATE_LIMIT_COPY.title}
            </h3>
          </div>
          <p className="text-sm leading-7 text-slate-700">{SIGNUP_RATE_LIMIT_COPY.body}</p>
          <p className="text-sm leading-6 text-slate-600">{SIGNUP_RATE_LIMIT_COPY.helper}</p>
          {isCoolingDown ? (
            <p className="text-xs font-medium leading-5 text-amber-700/80">
              Please wait {cooldownSeconds}s before retrying from this screen.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={isCoolingDown}
          onClick={onTryAgainLater}
        >
          {SIGNUP_RATE_LIMIT_COPY.primaryAction}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={onUseDifferentEmail}
        >
          {SIGNUP_RATE_LIMIT_COPY.secondaryAction}
        </Button>
      </div>
    </section>
  );
}
