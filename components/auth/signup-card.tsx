"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { type AuthActionNotice, signupAction } from "@/lib/actions/auth";

type SignupCardProps = {
  initialNotice?: AuthActionNotice | null;
};

export function SignupCard({ initialNotice = null }: SignupCardProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<AuthActionNotice | null>(initialNotice);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

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

      {notice ? (
        <Notice
          tone={notice.tone}
          className="mt-6"
          message={notice.message}
          detail={notice.detail}
        />
      ) : null}

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
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[12rem]" disabled={isPending}>
          {isPending ? "Creating..." : "Create account"}
        </Button>
      </form>
    </>
  );
}
