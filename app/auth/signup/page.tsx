import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, FolderKanban, Upload } from "lucide-react";
import { SetupRequired } from "@/components/shared/setup-required";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { signupAction } from "@/lib/actions/auth";
import { getSessionContext } from "@/lib/auth";
import { getFlashMessage } from "@/lib/flash";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const benefits = [
  { icon: FolderKanban, text: "Create dispute-specific case files." },
  { icon: Upload, text: "Upload receipts, screenshots, and records." },
  { icon: FileText, text: "Generate a complaint-ready summary." },
];

export default async function SignupPage({ searchParams }: SignupPageProps) {
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
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-[88rem] gap-6 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.95fr)] lg:items-center lg:gap-8 lg:px-10">
      <div className="surface rounded-[2rem] border border-white/80 p-6 sm:p-8 xl:p-10">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            ProofPilot Signup
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">
            Create your evidence workspace
          </h1>
          <p className="text-sm leading-7 text-slate-600">
            Start organizing disputes with a case dashboard, evidence storage, and structured AI outputs.
          </p>
        </div>

        {notice ? <Notice tone={notice.tone} className="mt-6" message={notice.message} /> : null}

        <form action={signupAction} className="mt-8 space-y-5">
          <Field label="Full name" htmlFor="fullName" hint="Used for your profile only.">
            <Input id="fullName" name="fullName" type="text" placeholder="Taylor Morgan" />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </Field>
          <Field label="Password" htmlFor="password" hint="Use at least 8 characters.">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              required
            />
          </Field>
          <SubmitButton
            className="w-full sm:w-auto sm:min-w-[12rem]"
            label="Create account"
            pendingLabel="Creating..."
          />
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-slate-950">
            Sign in
          </Link>
        </p>
      </div>

      <div className="space-y-6 lg:pl-4">
        <div className="inline-flex rounded-full border border-white/80 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
          Why ProofPilot
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Keep every fact, file, and follow-up in one complaint-ready flow.
          </h2>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            The MVP is designed for fast evidence organization so users can move from fragmented
            records to a coherent dispute package in minutes.
          </p>
        </div>
        <div className="grid gap-4">
          {benefits.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="rounded-[1.5rem] border border-white/80 bg-white/75 p-5 backdrop-blur"
            >
              <Icon className="size-5 text-slate-950" />
              <p className="mt-4 text-sm leading-7 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
