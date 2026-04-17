import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Sparkles } from "lucide-react";
import { SetupRequired } from "@/components/shared/setup-required";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/lib/actions/auth";
import { getSessionContext } from "@/lib/auth";
import { getFlashMessage } from "@/lib/flash";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:px-8">
        <SetupRequired />
      </div>
    );
  }

  const [{ user }, notice] = await Promise.all([
    getSessionContext(),
    getFlashMessage(searchParams),
  ]);

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-[88rem] gap-6 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:grid-cols-[minmax(18rem,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-8 lg:px-10">
      <div className="space-y-6 lg:pr-4">
        <div className="inline-flex rounded-full border border-white/80 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
          Secure sign in
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Re-enter your dispute workspace with the full paper trail intact.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Access your cases, evidence uploads, and structured outputs from one place.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/80 bg-white/75 p-5 backdrop-blur">
            <Shield className="size-5 text-slate-950" />
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Supabase Auth handles secure sessions and keeps evidence access scoped per user.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/80 bg-white/75 p-5 backdrop-blur">
            <Sparkles className="size-5 text-slate-950" />
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Continue from draft complaints, uploaded files, and intelligent case analysis without losing context.
            </p>
          </div>
        </div>
      </div>

      <div className="surface-strong rounded-[2rem] border border-white/80 p-6 sm:p-8 xl:p-10">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            ProofPilot Login
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Welcome back
          </h2>
          <p className="text-sm leading-7 text-slate-600">
            Sign in to view your cases and generate evidence summaries.
          </p>
        </div>

        {notice ? <Notice tone={notice.tone} className="mt-6" message={notice.message} /> : null}

        <form action={loginAction} className="mt-8 space-y-5">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </Field>
          <SubmitButton className="w-full sm:w-auto sm:min-w-[10rem]" label="Sign in" pendingLabel="Signing in..." />
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-slate-950">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
