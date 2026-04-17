import { ArrowLeft, CalendarClock, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupRequired } from "@/components/shared/setup-required";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createCaseAction } from "@/lib/actions/cases";
import { requireUser } from "@/lib/auth";
import { CASE_STATUS_OPTIONS } from "@/lib/constants/case-status";
import { DISPUTE_TYPES } from "@/lib/constants/dispute-types";
import { getFlashMessage } from "@/lib/flash";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type NewCasePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewCasePage({ searchParams }: NewCasePageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:px-8">
        <SetupRequired />
      </div>
    );
  }

  const [{ user }, notice] = await Promise.all([requireUser(), getFlashMessage(searchParams)]);
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto grid w-full max-w-[88rem] gap-6 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] lg:px-10">
      <div className="surface rounded-[2rem] border border-white/80 p-6 sm:p-8 xl:p-10">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-medium text-slate-600">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">New case</p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">
            Open a new complaint file
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Capture the core dispute facts first. Evidence uploads and analysis can be added after
            the case record is created.
          </p>
        </div>

        {notice ? <Notice tone={notice.tone} className="mt-6" message={notice.message} /> : null}

        <form action={createCaseAction} className="mt-8 grid gap-5">
          <Field label="Case title" htmlFor="title">
            <Input
              id="title"
              name="title"
              placeholder="Refund denied for damaged laptop sleeve"
              minLength={4}
              required
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Dispute type" htmlFor="disputeType">
              <Select id="disputeType" name="disputeType" required defaultValue="">
                <option value="" disabled>
                  Select a dispute type
                </option>
                {DISPUTE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Merchant or company" htmlFor="merchantName">
              <Input
                id="merchantName"
                name="merchantName"
                minLength={2}
                placeholder="Acme Retail"
                required
              />
            </Field>
            <Field label="Status" htmlFor="status" hint="Defaults to draft for new complaints.">
              <Select id="status" name="status" defaultValue="draft">
                {CASE_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Issue description" htmlFor="issueDescription">
            <Textarea
              id="issueDescription"
              name="issueDescription"
              minLength={20}
              rows={6}
              placeholder="Describe what happened, what the merchant promised, and why the dispute is unresolved."
              required
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Transaction amount" htmlFor="transactionAmount" hint="Optional. Use numbers only.">
              <Input
                id="transactionAmount"
                name="transactionAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="129.99"
              />
            </Field>
            <Field label="Incident date" htmlFor="incidentDate" hint="Optional. Use the main dispute date.">
              <Input id="incidentDate" name="incidentDate" type="date" />
            </Field>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <SubmitButton
              className="w-full sm:w-auto sm:min-w-[11rem]"
              label="Create case"
              pendingLabel="Creating case..."
            />
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              Cancel and return
            </Link>
          </div>
        </form>
      </div>

      <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <div className="surface-strong rounded-[2rem] border border-white/80 p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">What happens next</p>
          <div className="mt-6 space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
              <Scale className="size-5 text-slate-950" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">Build the core narrative</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Create a clean case record with the issue, the merchant involved, the amount at issue,
                and the date the dispute began.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
              <CalendarClock className="size-5 text-slate-950" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">Upload evidence</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Add receipts, screenshots, PDFs, statements, and support messages to the case detail page.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-5">
              <ShieldCheck className="size-5 text-slate-950" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">Generate structured outputs</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Run the analysis workflow to produce a timeline, extracted facts, missing evidence list,
                and a complaint draft rendered in polished cards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
