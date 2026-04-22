import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, FolderKanban, Upload } from "lucide-react";
import { SignupCard } from "@/components/auth/signup-card";
import { SetupRequired } from "@/components/shared/setup-required";
import type { AuthActionNotice } from "@/lib/actions/auth";
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

  const initialNotice: AuthActionNotice | null = notice;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-[88rem] gap-6 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.95fr)] lg:items-center lg:gap-8 lg:px-10">
      <div className="surface rounded-[2rem] border border-white/80 p-6 sm:p-8 xl:p-10">
        <SignupCard initialNotice={initialNotice} />

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
