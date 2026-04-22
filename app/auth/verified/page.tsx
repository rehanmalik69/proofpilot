import { redirect } from "next/navigation";
import { CheckCircle2, FolderKanban, Shield } from "lucide-react";
import { VerifiedCard } from "@/components/auth/verified-card";
import { SetupRequired } from "@/components/shared/setup-required";
import { getSessionContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type VerifiedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AuthSearchParams = Record<string, string | string[] | undefined>;

const highlights = [
  {
    icon: CheckCircle2,
    text: "Your email identity is confirmed and ready for secure sign-in.",
  },
  {
    icon: FolderKanban,
    text: "Your dispute workspace can now hold cases, uploads, and structured outputs.",
  },
  {
    icon: Shield,
    text: "Supabase authentication keeps your files and case data scoped to your account.",
  },
];

export default async function VerifiedPage({ searchParams }: VerifiedPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:px-8">
        <SetupRequired />
      </div>
    );
  }

  const [{ user }, resolvedSearchParams] = await Promise.all([
    getSessionContext(),
    searchParams ?? Promise.resolve<AuthSearchParams>({}),
  ]);

  const email = typeof resolvedSearchParams.email === "string" ? resolvedSearchParams.email : "";

  if (!email && !user) {
    redirect("/auth/login?verified=1");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-[88rem] gap-6 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.98fr)] lg:items-center lg:gap-8 lg:px-10">
      <div className="space-y-6 lg:pr-4">
        <div className="inline-flex rounded-full border border-white/80 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
          Verification complete
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Your ProofPilot account is now fully activated.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            The verification link worked correctly, and your email is now ready to access your complaint workspace.
          </p>
        </div>
        <div className="grid gap-4">
          {highlights.map(({ icon: Icon, text }) => (
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

      <div className="surface-strong rounded-[2rem] border border-white/80 p-6 sm:p-8 xl:p-10">
        <VerifiedCard email={email || user?.email || undefined} isAuthenticated={Boolean(user)} />
      </div>
    </div>
  );
}
