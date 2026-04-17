import { CheckCircle2, ClipboardCheck, Eye, FileText, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { CaseCard } from "@/components/dashboard/case-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SetupRequired } from "@/components/shared/setup-required";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { createDemoCaseAction } from "@/lib/actions/cases";
import { requireUser } from "@/lib/auth";
import { normalizeCaseStatus } from "@/lib/constants/case-status";
import { getDashboardOverview } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:px-8">
        <SetupRequired />
      </div>
    );
  }

  const { user } = await requireUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { cases, recentActivity } = await getDashboardOverview(user.id);
  const underReviewCount = cases.filter((item) => normalizeCaseStatus(item.status) === "under_review").length;
  const readyToSubmitCount = cases.filter(
    (item) => normalizeCaseStatus(item.status) === "ready_to_submit",
  ).length;
  const resolvedCount = cases.filter((item) => normalizeCaseStatus(item.status) === "resolved").length;

  return (
    <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-7 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:gap-8 lg:px-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dashboard</p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">
            Your active complaint cases
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Review open disputes, check which cases already have structured outputs, and start a new
            complaint file when you need one.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
          <form action={createDemoCaseAction} className="w-full sm:w-auto">
            <SubmitButton
              label="Try Demo Case"
              pendingLabel="Creating demo..."
              iconName="sparkles"
              variant="secondary"
              size="lg"
              className="w-full sm:min-w-[12rem]"
            />
          </form>
          <ButtonLink href="/cases/new" size="lg" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Create New Case
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface rounded-[1.8rem] border border-white/80 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Cases</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{cases.length}</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <FileText className="size-5" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            All disputes currently tracked in ProofPilot.
          </p>
        </div>
        <div className="surface rounded-[1.8rem] border border-white/80 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Under review
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{underReviewCount}</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Eye className="size-5" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Matters that are actively being reviewed before escalation.
          </p>
        </div>
        <div className="surface rounded-[1.8rem] border border-white/80 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Ready to submit
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{readyToSubmitCount}</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ClipboardCheck className="size-5" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Files that are structured enough to be sent to a bank, merchant, or regulator.
          </p>
        </div>
        <div className="surface rounded-[1.8rem] border border-white/80 p-5 sm:p-6 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Resolved
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{resolvedCount}</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Cases that have already reached a completed outcome.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-5">
          {cases.length > 0 ? (
            cases.map((caseItem) => <CaseCard key={caseItem.id} caseItem={caseItem} />)
          ) : (
            <Card className="surface border-white/80">
              <CardContent className="px-6 py-12 text-center sm:px-8 sm:py-14">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <FileText className="size-6" />
                </div>
                <h2 className="mt-5 text-[1.85rem] font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  No complaint files yet
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Start with your own dispute or spin up the bundled demo case so ProofPilot is
                  immediately presentation-ready with evidence, analysis, and a polished complaint draft.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <form action={createDemoCaseAction} className="w-full sm:w-auto">
                    <SubmitButton
                      label="Try Demo Case"
                      pendingLabel="Creating demo..."
                      iconName="sparkles"
                      variant="secondary"
                      className="w-full sm:min-w-[12rem]"
                    />
                  </form>
                  <ButtonLink href="/cases/new" className="w-full sm:w-auto">
                    <Plus className="size-4" />
                    Create New Case
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <RecentActivity items={recentActivity} />
          <Card className="surface-strong border-white/80">
            <CardContent className="space-y-4 pt-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Demo ready
                </p>
                <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.03em] text-slate-950">
                  Launch a sample case in one click
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The demo flow creates a realistic dispute, adds a bundled text evidence record,
                  and saves a structured analysis so you can present ProofPilot immediately.
                </p>
              </div>
              <form action={createDemoCaseAction}>
                <SubmitButton
                  label="Create Demo Case"
                  pendingLabel="Creating demo..."
                  iconName="sparkles"
                  variant="secondary"
                  className="w-full sm:w-auto sm:min-w-[12rem]"
                />
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
