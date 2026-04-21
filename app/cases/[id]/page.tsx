import { ArrowRight, CalendarDays, FileText, Landmark, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnalysisOutput } from "@/components/cases/analysis-output";
import { EvidenceList } from "@/components/cases/evidence-list";
import { EvidenceUploadPanel } from "@/components/cases/evidence-upload-panel";
import { SetupRequired } from "@/components/shared/setup-required";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { runAnalysisAction, updateCaseStatusAction } from "@/lib/actions/cases";
import { requireUser } from "@/lib/auth";
import {
  CASE_STATUS_OPTIONS,
  getCaseStatusLabel,
  getCaseStatusVariant,
} from "@/lib/constants/case-status";
import { getFlashMessage } from "@/lib/flash";
import { getCaseDetail } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatCurrency, formatDate } from "@/lib/utils";

type CaseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CaseDetailPage({ params, searchParams }: CaseDetailPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:px-8">
        <SetupRequired />
      </div>
    );
  }

  const [{ id }, { user }, notice] = await Promise.all([
    params,
    requireUser(),
    getFlashMessage(searchParams),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  const data = await getCaseDetail(user.id, id);
  if (!data) {
    notFound();
  }

  const { caseItem, evidenceFiles, analysis } = data;

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-7 px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:gap-8 lg:px-8 xl:px-10">
      {notice ? <Notice tone={notice.tone} message={notice.message} /> : null}

      <section className="surface-strong overflow-hidden rounded-[2rem] border border-white/80">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:gap-8 lg:p-10">
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{caseItem.dispute_type}</Badge>
              <Badge variant={getCaseStatusVariant(caseItem.status)}>
                {getCaseStatusLabel(caseItem.status)}
              </Badge>
              <Badge variant="success">{analysis ? "Analysis ready" : "Awaiting analysis"}</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard" className="font-medium text-slate-600">
                  Dashboard
                </Link>
                <ArrowRight className="size-4" />
                <span>{caseItem.title}</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {caseItem.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-slate-600 xl:max-w-none">
                {caseItem.issue_description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/85 p-4 sm:rounded-[1.5rem] sm:p-5">
                <Landmark className="size-4 text-slate-950 sm:size-5" />
                <div className="mt-3 text-[11px] text-slate-500 sm:mt-4 sm:text-sm">Merchant</div>
                <div className="mt-1 text-sm font-semibold leading-5 text-slate-950 sm:text-lg">
                  {caseItem.merchant_name}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/85 p-4 sm:rounded-[1.5rem] sm:p-5">
                <Wallet className="size-4 text-slate-950 sm:size-5" />
                <div className="mt-3 text-[11px] text-slate-500 sm:mt-4 sm:text-sm">Amount</div>
                <div className="mt-1 text-sm font-semibold leading-5 text-slate-950 sm:text-lg">
                  {formatCurrency(caseItem.transaction_amount)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/85 p-4 sm:rounded-[1.5rem] sm:p-5">
                <CalendarDays className="size-4 text-slate-950 sm:size-5" />
                <div className="mt-3 text-[11px] text-slate-500 sm:mt-4 sm:text-sm">Incident date</div>
                <div className="mt-1 text-sm font-semibold leading-5 text-slate-950 sm:text-lg">
                  {formatDate(caseItem.incident_date)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/85 p-4 sm:rounded-[1.5rem] sm:p-5">
                <ShieldCheck className="size-4 text-slate-950 sm:size-5" />
                <div className="mt-3 text-[11px] text-slate-500 sm:mt-4 sm:text-sm">Status</div>
                <div className="mt-1 text-sm font-semibold leading-5 text-slate-950 sm:text-lg">
                  {getCaseStatusLabel(caseItem.status)}
                </div>
              </div>
              <div className="col-span-2 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/85 p-4 sm:rounded-[1.5rem] sm:p-5 xl:col-span-1">
                <FileText className="size-4 text-slate-950 sm:size-5" />
                <div className="mt-3 text-[11px] text-slate-500 sm:mt-4 sm:text-sm">Created</div>
                <div className="mt-1 text-sm font-semibold leading-5 text-slate-950 sm:text-lg">
                  {formatDate(caseItem.created_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-8 lg:self-start xl:col-span-4">
            <EvidenceUploadPanel caseId={caseItem.id} />

            <Card className="surface border-white/80 shadow-[0_22px_48px_rgba(15,23,42,0.05)]">
              <CardHeader>
                <CardDescription>Case workflow</CardDescription>
                <CardTitle className="text-[1.7rem]">Update case status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-slate-600">
                  Move the case from intake to escalation with a status that reflects how ready the
                  complaint file is for review or submission.
                </p>
                <form action={updateCaseStatusAction} className="space-y-4">
                  <input type="hidden" name="caseId" value={caseItem.id} />
                  <Select name="status" defaultValue={caseItem.status}>
                    {CASE_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                  <SubmitButton
                    label="Save status"
                    pendingLabel="Saving status..."
                    className="w-full sm:w-auto sm:min-w-[11rem]"
                  />
                </form>
              </CardContent>
            </Card>

            <Card className="surface border-white/80 shadow-[0_22px_48px_rgba(15,23,42,0.05)]">
              <CardHeader>
                <CardDescription>Analysis workflow</CardDescription>
                <CardTitle className="text-[1.7rem]">Generate structured output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-slate-600">
                  Analyze Evidence runs ProofPilot&apos;s local rules-based analysis engine against
                  the case details and the evidence inventory already attached to this workspace.
                  The result is saved to the case record and rendered below as ProofPilot&apos;s
                  intelligence layer.
                </p>
                <form action={runAnalysisAction}>
                  <input type="hidden" name="caseId" value={caseItem.id} />
                  <SubmitButton
                    label="Analyze evidence"
                    pendingLabel="Analyzing..."
                    iconName="sparkles"
                    className="w-full sm:w-auto sm:min-w-[11rem]"
                  />
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-8">
          {analysis ? (
            <AnalysisOutput
              analysis={analysis}
              caseId={caseItem.id}
              caseTitle={caseItem.title}
              caseStatusLabel={getCaseStatusLabel(caseItem.status)}
            />
          ) : (
            <Card className="surface border-white/80">
              <CardHeader>
                <CardDescription>Core intelligence layer</CardDescription>
                <CardTitle className="text-[1.9rem]">Ready to generate the first analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-base leading-7 text-slate-600">
                  Analyze Evidence will turn this case file into a structured complaint workspace with
                  chronology, extracted facts, scoring, proof gaps, and a polished draft you can
                  refine.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Timeline
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">A clear dispute chronology</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      See incident timing, uploaded evidence milestones, and the current review posture in
                      one vertical timeline.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Extracted facts
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">The core dispute record</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Merchant, amount, dates, case status, and evidence count rendered as a clean snapshot.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Missing evidence
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">The highest-value proof gaps</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Get a prioritized checklist of documents or screenshots that would strengthen the file.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Complaint draft
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">A ready-to-edit message</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Start with a professional complaint draft that can be copied, refined, or exported.
                    </p>
                  </div>
                </div>
                <form action={runAnalysisAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <input type="hidden" name="caseId" value={caseItem.id} />
                  <SubmitButton
                    label="Analyze evidence"
                    pendingLabel="Analyzing..."
                    iconName="sparkles"
                    className="w-full sm:w-auto sm:min-w-[11rem]"
                  />
                  <ButtonLink href="/dashboard" variant="secondary" className="w-full sm:w-auto">
                    Return to dashboard
                  </ButtonLink>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
          <EvidenceList files={evidenceFiles} />
        </div>
      </section>
    </div>
  );
}
