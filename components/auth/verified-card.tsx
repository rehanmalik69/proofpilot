import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

type VerifiedCardProps = {
  email?: string;
  isAuthenticated: boolean;
};

export function VerifiedCard({ email, isAuthenticated }: VerifiedCardProps) {
  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600/80">
          Email verified
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Your account is ready
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          Your email address has been verified successfully. ProofPilot is ready for you to continue.
        </p>
      </div>

      <section className="mt-8 rounded-[1.75rem] border border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_18px_45px_rgba(16,185,129,0.08)] sm:p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80 sm:size-12">
              <ArrowRight className="size-5 sm:size-[1.375rem]" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700/80">
                  Verification complete
                </p>
                <h3 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.85rem]">
                  Email verified successfully
                </h3>
              </div>
              <p className="text-sm leading-7 text-slate-700">
                Your ProofPilot account is now active.
                {email ? ` ${email} has been confirmed.` : null}
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Continue to your workspace or return to the sign-in page.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isAuthenticated ? (
              <ButtonLink href="/dashboard" className="w-full sm:w-auto">
                <LayoutDashboard className="size-4" />
                Continue to dashboard
              </ButtonLink>
            ) : (
              <ButtonLink
                href={email ? `/auth/login?email=${encodeURIComponent(email)}` : "/auth/login"}
                className="w-full sm:w-auto"
              >
                <LogIn className="size-4" />
                Sign in to continue
              </ButtonLink>
            )}
            <ButtonLink href="/" variant="secondary" className="w-full sm:w-auto">
              Back to homepage
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
