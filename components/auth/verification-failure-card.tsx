"use client";

import { useState, useTransition } from "react";
import { VerificationPanel } from "@/components/auth/verification-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { type AuthActionNotice, resendVerificationEmailAction } from "@/lib/actions/auth";

type VerificationFailureCardProps = {
  email?: string;
  reason: "expired" | "failed";
};

const reasonCopy = {
  expired: {
    title: "This verification link has expired",
    body: "The verification link you opened is no longer valid. Request a fresh verification email and open the newest link from your inbox.",
    helper: "Use the resend action below, then open the latest verification email from ProofPilot.",
    footer: "After you verify your email, return to ProofPilot and sign in again.",
  },
  failed: {
    title: "We couldn't verify your email",
    body: "The verification attempt did not complete successfully. Request a new verification email and try again from the latest message in your inbox.",
    helper: "If the link is old or partially opened, the safest next step is to send a fresh verification email.",
    footer: "Once verification succeeds, you can continue straight into ProofPilot.",
  },
} as const;

export function VerificationFailureCard({
  email,
  reason,
}: VerificationFailureCardProps) {
  const [feedback, setFeedback] = useState<AuthActionNotice | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy = reasonCopy[reason];

  async function handleResend() {
    if (!email) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await resendVerificationEmailAction({ email });
      setFeedback(result.notice ?? null);
    });
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600/80">
          Verification help
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          We&apos;ll get you back on track
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          ProofPilot can send a new verification email so you can complete account activation cleanly.
        </p>
      </div>

      <VerificationPanel
        className="mt-8"
        title={copy.title}
        body={copy.body}
        secondaryLine={email ? `We can resend the verification email to ${email}.` : undefined}
        helperText={copy.helper}
        footer={copy.footer}
        feedback={feedback}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isPending || !email}
              onClick={handleResend}
            >
              {isPending ? "Sending..." : "Resend verification email"}
            </Button>
            <ButtonLink
              href={email ? `/auth/login?email=${encodeURIComponent(email)}` : "/auth/login"}
              className="w-full sm:w-auto"
            >
              Back to sign in
            </ButtonLink>
            <ButtonLink href="/auth/signup" variant="ghost" className="w-full sm:w-auto">
              Use a different email
            </ButtonLink>
          </div>
        }
        note="If the email does not arrive, check Spam, Junk, and Promotions before trying again."
      />
    </>
  );
}
