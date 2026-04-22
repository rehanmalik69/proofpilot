"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { RateLimitPanel } from "@/components/auth/rate-limit-panel";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { type AuthActionNotice, signupAction } from "@/lib/actions/auth";

type SignupCardProps = {
  initialNotice?: AuthActionNotice | null;
};

const SUBMIT_COOLDOWN_MS = 3_500;
const RATE_LIMIT_COOLDOWN_MS = 20_000;

export function SignupCard({ initialNotice = null }: SignupCardProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<AuthActionNotice | null>(initialNotice);
  const [isRateLimited, setIsRateLimited] = useState(false);
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

  function resetToForm(clearEmail = false) {
    setIsRateLimited(false);
    setNotice(null);
    setCooldownUntil(null);

    if (clearEmail) {
      setEmail("");
      setPassword("");
      setFullName("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending || cooldownSeconds > 0) {
      return;
    }

    setNotice(null);
    setIsRateLimited(false);
    startCooldown(SUBMIT_COOLDOWN_MS);

    startTransition(async () => {
      const result = await signupAction({ fullName, email, password });

      if (result.status === "authenticated") {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (result.status === "pending_verification") {
        router.replace(`/auth/check-email?email=${encodeURIComponent(result.email ?? email)}`);
        return;
      }

      if (result.status === "rate_limited") {
        setIsRateLimited(true);
        setNotice(result.notice ?? null);
        startCooldown(RATE_LIMIT_COOLDOWN_MS);
        return;
      }

      setNotice(result.notice ?? null);
    });
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          ProofPilot Signup
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">
          Create your evidence workspace
        </h1>
        <p className="text-sm leading-7 text-slate-600">
          Start organizing disputes with a case dashboard, evidence storage, and structured AI outputs.
        </p>
      </div>

      {isRateLimited ? (
        <RateLimitPanel
          cooldownSeconds={cooldownSeconds}
          onTryAgainLater={() => resetToForm(false)}
          onUseDifferentEmail={() => resetToForm(true)}
        />
      ) : notice ? (
        <Notice
          tone={notice.tone}
          className="mt-6"
          message={notice.message}
          detail={notice.detail}
        />
      ) : null}

      {!isRateLimited ? (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Field label="Full name" htmlFor="fullName" hint="Used for your profile only.">
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Taylor Morgan"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
          />
        </Field>
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
        <Field label="Password" htmlFor="password" hint="Use at least 8 characters.">
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Button
          type="submit"
          className="w-full sm:w-auto sm:min-w-[12rem]"
          disabled={isPending || cooldownSeconds > 0}
        >
          {isPending ? "Creating..." : cooldownSeconds > 0 ? "Please wait..." : "Create account"}
        </Button>
        </form>
      ) : null}
    </>
  );
}
