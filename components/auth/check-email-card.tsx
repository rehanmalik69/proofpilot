"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { type AuthActionNotice, resendVerificationEmailAction } from "@/lib/actions/auth";
import { VerificationPanel } from "@/components/auth/verification-panel";

type CheckEmailCardProps = {
  email: string;
};

const RESEND_COOLDOWN_MS = 5_000;
const RATE_LIMIT_COOLDOWN_MS = 20_000;

export function CheckEmailCard({ email }: CheckEmailCardProps) {
  const [feedback, setFeedback] = useState<AuthActionNotice | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  function startCooldown(durationMs: number) {
    setCooldownUntil(Date.now() + durationMs);
  }

  async function handleResend() {
    if (isPending || cooldownSeconds > 0) {
      return;
    }

    setFeedback(null);
    startCooldown(RESEND_COOLDOWN_MS);

    startTransition(async () => {
      const result = await resendVerificationEmailAction({ email });
      setFeedback(result.notice ?? null);

      if (result.status === "rate_limited") {
        startCooldown(RATE_LIMIT_COOLDOWN_MS);
      }
    });
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Email confirmation
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Finish activating your account
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          Confirm the email address on your ProofPilot account before you sign in.
        </p>
      </div>

      <VerificationPanel
        className="mt-8"
        title="Check your email"
        body={`Your ProofPilot account has been created. We sent a verification link to ${email}. Please open that email and click the link to activate your account.`}
        helperText="After verifying, return to ProofPilot and sign in."
        note="If you cannot find the email, check Spam, Junk, or Promotions."
        feedback={feedback}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isPending || cooldownSeconds > 0}
              onClick={handleResend}
            >
              {isPending
                ? "Sending..."
                : cooldownSeconds > 0
                  ? "Please wait..."
                  : "Resend verification email"}
            </Button>
            <ButtonLink
              href={`/auth/login?email=${encodeURIComponent(email)}`}
              variant="primary"
              className="w-full sm:w-auto"
            >
              Back to sign in
            </ButtonLink>
            <ButtonLink href="/auth/signup" variant="ghost" className="w-full sm:w-auto">
              Use a different email
            </ButtonLink>
          </div>
        }
      />

      <p className="mt-6 text-sm text-slate-600">
        Already verified?{" "}
        <Link href={`/auth/login?email=${encodeURIComponent(email)}`} className="font-semibold text-slate-950">
          Return to sign in
        </Link>
      </p>
    </>
  );
}
