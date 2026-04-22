import { AlertTriangle, MailCheck, ShieldAlert } from "lucide-react";
import { VerificationFailureCard } from "@/components/auth/verification-failure-card";
import { SetupRequired } from "@/components/shared/setup-required";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type VerificationErrorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AuthSearchParams = Record<string, string | string[] | undefined>;

const highlights = [
  {
    icon: AlertTriangle,
    text: "Old verification links can expire or become invalid after reuse.",
  },
  {
    icon: MailCheck,
    text: "The fastest fix is to request a fresh verification email and open the newest message.",
  },
  {
    icon: ShieldAlert,
    text: "ProofPilot keeps the recovery flow inside the app so users are never dropped onto a blank or confusing screen.",
  },
];

export default async function VerificationErrorPage({
  searchParams,
}: VerificationErrorPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:px-8">
        <SetupRequired />
      </div>
    );
  }

  const resolvedSearchParams = searchParams ?? Promise.resolve<AuthSearchParams>({});
  const params = await resolvedSearchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const reason =
    typeof params.reason === "string" && params.reason === "expired" ? "expired" : "failed";

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-[88rem] gap-6 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.98fr)] lg:items-center lg:gap-8 lg:px-10">
      <div className="space-y-6 lg:pr-4">
        <div className="inline-flex rounded-full border border-white/80 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
          Verification recovery
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            The verification link did not complete, but the account flow is still recoverable.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            ProofPilot can send a fresh verification email so the user can finish activation without leaving the product experience.
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
        <VerificationFailureCard email={email || undefined} reason={reason} />
      </div>
    </div>
  );
}
