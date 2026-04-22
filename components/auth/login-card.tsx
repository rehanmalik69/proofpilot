"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import {
  type AuthActionNotice,
  loginAction,
  recheckVerificationAction,
  resendVerificationEmailAction,
} from "@/lib/actions/auth";
import { VerificationPanel } from "@/components/auth/verification-panel";

type LoginCardProps = {
  initialEmail?: string;
  initialNotice?: AuthActionNotice | null;
};

export function LoginCard({ initialEmail = "", initialNotice = null }: LoginCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<AuthActionNotice | null>(initialNotice);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<AuthActionNotice | null>(null);
  const [isLoginPending, startLoginTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const [isRecheckPending, startRecheckTransition] = useTransition();

  const loginDisabled = isLoginPending || isResendPending || isRecheckPending;

  function resetFeedback() {
    setNotice(null);
    setVerificationFeedback(null);
  }

  function handleUseDifferentEmail() {
    setShowVerification(false);
    setNotice(null);
    setVerificationFeedback(null);
    setEmail("");
    setPassword("");
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    startLoginTransition(async () => {
      const result = await loginAction({ email, password });

      if (result.status === "success") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (result.status === "verification_required") {
        setShowVerification(true);
        setVerificationFeedback(result.notice ?? null);
        return;
      }

      setShowVerification(false);
      setNotice(result.notice ?? null);
    });
  }

  async function handleResendVerification() {
    setVerificationFeedback(null);

    startResendTransition(async () => {
      const result = await resendVerificationEmailAction({ email });
      setVerificationFeedback(result.notice ?? null);
    });
  }

  async function handleRecheckVerification() {
    setVerificationFeedback(null);
    setNotice(null);

    startRecheckTransition(async () => {
      const result = await recheckVerificationAction({ email, password });

      if (result.status === "success") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (result.status === "verification_required") {
        setShowVerification(true);
        setVerificationFeedback(result.notice ?? null);
        return;
      }

      setShowVerification(false);
      setNotice(result.notice ?? null);
    });
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          ProofPilot Login
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Welcome back
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          Sign in to view your cases and generate evidence summaries.
        </p>
      </div>

      {showVerification ? (
        <VerificationPanel
          className="mt-8"
          title="Verify your email to continue"
          body="We found your account, but your email address has not been verified yet. Please check your inbox and click the verification link before signing in."
          secondaryLine={`We sent the verification email to ${email}.`}
          helperText="Do not forget to check Spam, Junk, and Promotions."
          footer="Once you verify your email, come back here and sign in again."
          feedback={verificationFeedback}
          actions={
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isResendPending || isRecheckPending || !email.trim()}
                onClick={handleResendVerification}
              >
                {isResendPending ? "Sending..." : "Resend verification email"}
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={isResendPending || isRecheckPending || !email.trim() || !password}
                onClick={handleRecheckVerification}
              >
                {isRecheckPending ? "Checking..." : "I’ve verified my email"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={isResendPending || isRecheckPending}
                onClick={handleUseDifferentEmail}
              >
                Use a different email
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {notice ? (
            <Notice
              tone={notice.tone}
              className="mt-6"
              message={notice.message}
              detail={notice.detail}
            />
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={handleLoginSubmit}>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" className="w-full sm:w-auto sm:min-w-[10rem]" disabled={loginDisabled}>
              {isLoginPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </>
      )}
    </>
  );
}
