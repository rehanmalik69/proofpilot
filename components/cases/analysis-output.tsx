"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  FileText,
  Files,
  Landmark,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  buildCaseSummaryText,
  buildComplaintDraftText,
  buildFullReportText,
} from "@/lib/analysis-summary";
import { runAnalysisAction } from "@/lib/actions/cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AnalysisOutput as AnalysisOutputType, NoticeTone } from "@/lib/types/domain";
import { formatDate, safeFileName } from "@/lib/utils";

type AnalysisOutputProps = {
  analysis: AnalysisOutputType;
  caseId: string;
  caseTitle: string;
  caseStatusLabel: string;
};

type FeedbackState = {
  tone: NoticeTone;
  message: string;
} | null;

const analysisCardClass =
  "surface h-full border-white/80 shadow-[0_22px_48px_rgba(15,23,42,0.06)]";
const analysisPanelClass =
  "rounded-[1.35rem] border border-slate-200/80 bg-slate-50/82 p-4 sm:rounded-[1.5rem] sm:p-5";
const sectionLabelClass =
  "text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.14em]";

const priorityStyles = {
  High: {
    icon: AlertCircle,
    iconClassName: "text-rose-600",
    badgeClassName: "bg-rose-100 text-rose-700",
  },
  Medium: {
    icon: Circle,
    iconClassName: "text-amber-600",
    badgeClassName: "bg-amber-100 text-amber-700",
  },
  Low: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-600",
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
} as const;

function formatLevel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getProviderBadge(provider?: NonNullable<AnalysisOutputType["meta"]>["provider"]) {
  switch (provider) {
    case "local":
      return { label: "Local engine", variant: "info" as const };
    case "openai":
      return { label: "OpenAI", variant: "info" as const };
    default:
      return { label: "Fallback", variant: "warning" as const };
  }
}

function getScoreBadgeVariant(
  type: "evidence_strength" | "urgency" | "case_readiness",
  value?: string,
): "success" | "warning" | "info" | "ghost" {
  if (!value) {
    return "ghost";
  }

  if (type === "case_readiness") {
    return value.includes("Ready") ? "success" : value.includes("Needs") ? "warning" : "info";
  }

  if (value === "strong" || value === "low") {
    return "success";
  }

  if (value === "moderate" || value === "medium") {
    return "info";
  }

  return "warning";
}

function copyTextFallback(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AnalysisOutput({
  analysis,
  caseId,
  caseTitle,
  caseStatusLabel,
}: AnalysisOutputProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isCopyingDraft, setIsCopyingDraft] = useState(false);
  const [isCopyingReport, setIsCopyingReport] = useState(false);
  const [isDownloadingDraft, setIsDownloadingDraft] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const facts = analysis.rawOutput?.extracted_facts;
  const score = analysis.score ?? analysis.rawOutput?.score;
  const complaintText = buildComplaintDraftText(analysis);
  const caseSummaryText = buildCaseSummaryText({ analysis, caseTitle, caseStatusLabel });
  const fullReportText = buildFullReportText({ analysis, caseTitle, caseStatusLabel });
  const isBusy =
    isCopyingDraft || isCopyingReport || isDownloadingDraft || isDownloading || isReanalyzing;
  const providerBadge = getProviderBadge(analysis.meta?.provider);

  const factRows = [
    {
      label: "Merchant name",
      value:
        facts?.merchant_name ??
        analysis.extractedFacts.find((fact) => fact.label === "Merchant name")?.value ??
        "Not available",
      icon: Landmark,
    },
    {
      label: "Amount in dispute",
      value:
        facts?.amount_in_dispute ??
        analysis.extractedFacts.find((fact) => fact.label === "Amount in dispute")?.value ??
        "Not available",
      icon: Wallet,
    },
    {
      label: "Incident date",
      value:
        facts?.incident_date ??
        analysis.extractedFacts.find((fact) => fact.label === "Incident date")?.value ??
        "Not available",
      icon: CalendarDays,
    },
    {
      label: "Dispute type",
      value:
        facts?.dispute_type ??
        analysis.extractedFacts.find((fact) => fact.label === "Dispute type")?.value ??
        "Not available",
      icon: FileText,
    },
    {
      label: "Severity level",
      value:
        facts?.severity_level ??
        analysis.extractedFacts.find((fact) => fact.label === "Severity level")?.value ??
        "Not available",
      icon: AlertCircle,
    },
    {
      label: "Case status",
      value: caseStatusLabel,
      icon: ShieldCheck,
    },
    {
      label: "Evidence count",
      value:
        typeof facts?.evidence_count === "number"
          ? `${facts.evidence_count} file${facts.evidence_count === 1 ? "" : "s"}`
          : "Not available",
      icon: Files,
    },
  ];

  async function handleCopyComplaint() {
    try {
      setIsCopyingDraft(true);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(complaintText);
      } else {
        copyTextFallback(complaintText);
      }

      setFeedback({ tone: "success", message: "Complaint draft copied to your clipboard." });
    } catch {
      setFeedback({
        tone: "error",
        message: "Clipboard access was blocked. Try again or copy from the draft card.",
      });
    } finally {
      setIsCopyingDraft(false);
    }
  }

  async function handleCopyFullReport() {
    try {
      setIsCopyingReport(true);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullReportText);
      } else {
        copyTextFallback(fullReportText);
      }

      setFeedback({ tone: "success", message: "Full case report copied to your clipboard." });
    } catch {
      setFeedback({
        tone: "error",
        message: "Clipboard access was blocked. Try copying the report again.",
      });
    } finally {
      setIsCopyingReport(false);
    }
  }

  function handleDownloadComplaint() {
    try {
      setIsDownloadingDraft(true);
      downloadTextFile(
        `proofpilot-${safeFileName(caseTitle)}-complaint-draft.txt`,
        complaintText,
      );
      setFeedback({ tone: "success", message: "Complaint draft downloaded." });
    } catch {
      setFeedback({
        tone: "error",
        message: "The complaint draft could not be downloaded right now.",
      });
    } finally {
      setIsDownloadingDraft(false);
    }
  }

  function handleDownloadSummary() {
    try {
      setIsDownloading(true);
      downloadTextFile(`proofpilot-${safeFileName(caseTitle)}-case-summary.txt`, caseSummaryText);
      setFeedback({ tone: "success", message: "Case summary downloaded." });
    } catch {
      setFeedback({
        tone: "error",
        message: "The case summary could not be downloaded right now.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="grid gap-4 sm:gap-5 lg:gap-6 xl:grid-cols-2">
      <Card className={`${analysisCardClass} xl:col-span-2`}>
        <CardContent className="pt-5 sm:pt-6">
          <div className="rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 sm:rounded-[1.7rem] sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                    ProofPilot intelligence layer
                  </div>
                  <p className="max-w-3xl text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">
                    {analysis.summary ?? analysis.meta?.basis}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={providerBadge.variant}>{providerBadge.label}</Badge>
                  {analysis.meta?.model ? <Badge variant="ghost">{analysis.meta.model}</Badge> : null}
                  {analysis.meta?.generatedAt ? (
                    <Badge variant="ghost">Generated {formatDate(analysis.meta.generatedAt)}</Badge>
                  ) : null}
                  {typeof facts?.evidence_count === "number" ? (
                    <Badge variant="ghost">
                      {facts.evidence_count} evidence file
                      {facts.evidence_count === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                  {score ? (
                    <Badge
                      variant={getScoreBadgeVariant("evidence_strength", score.evidence_strength)}
                    >
                      Evidence {formatLevel(score.evidence_strength)}
                    </Badge>
                  ) : null}
                  {score ? (
                    <Badge variant={getScoreBadgeVariant("urgency", score.urgency)}>
                      Urgency {formatLevel(score.urgency)}
                    </Badge>
                  ) : null}
                  {score ? (
                    <Badge
                      variant={getScoreBadgeVariant(
                        "case_readiness",
                        score.case_readiness.label,
                      )}
                    >
                      {score.case_readiness.label} {score.case_readiness.percentage}%
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex w-full max-w-3xl flex-col gap-2.5 sm:gap-3 xl:items-end">
                <div className="w-full rounded-[1.35rem] border border-slate-200/80 bg-white/88 p-2.5 sm:rounded-[1.5rem] sm:p-3">
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    <div className={sectionLabelClass}>Workspace actions</div>
                    <div className="flex flex-wrap items-stretch gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={handleDownloadComplaint}
                        className="w-full justify-center sm:flex-1 sm:min-w-[12rem] lg:w-auto lg:flex-none"
                      >
                        <Download className="size-4" />
                        {isDownloadingDraft ? "Preparing..." : "Download complaint"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={handleDownloadSummary}
                        className="w-full justify-center sm:flex-1 sm:min-w-[12rem] lg:w-auto lg:flex-none"
                      >
                        <Download className="size-4" />
                        {isDownloading ? "Preparing..." : "Download summary"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={handleCopyFullReport}
                        className="w-full justify-center sm:flex-1 sm:min-w-[12rem] lg:w-auto lg:flex-none"
                      >
                        <ClipboardCheck className="size-4" />
                        {isCopyingReport ? "Copying..." : "Copy full report"}
                      </Button>
                      <form
                        action={runAnalysisAction}
                        onSubmit={() => setIsReanalyzing(true)}
                        className="w-full sm:flex-1 sm:min-w-[12rem] lg:w-auto lg:flex-none"
                      >
                        <input type="hidden" name="caseId" value={caseId} />
                        <SubmitButton
                          label="Re-analyze"
                          pendingLabel="Re-analyzing..."
                          iconName="refresh"
                          size="sm"
                          disabled={isBusy}
                          className="w-full justify-center"
                        />
                      </form>
                    </div>
                  </div>
                </div>

                {feedback ? (
                  <Notice tone={feedback.tone} message={feedback.message} className="w-full" />
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${analysisCardClass} xl:col-span-2`}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[1.1rem] bg-slate-950 text-white shadow-[0_18px_38px_rgba(15,23,42,0.18)] sm:size-11 sm:rounded-2xl">
              <Sparkles className="size-4 sm:size-5" />
            </div>
            <div className="space-y-1">
              <CardDescription>Case chronology</CardDescription>
              <CardTitle className="text-[1.45rem] sm:text-[1.7rem]">Timeline</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-5">
          <div className="rounded-[1.45rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.9))] px-4 py-5 sm:rounded-[1.65rem] sm:px-6 sm:py-6">
            {analysis.timeline.map((item, index) => (
              <div key={`${item.date}-${item.title}`} className="relative pl-9 sm:pl-10">
                {index < analysis.timeline.length - 1 ? (
                  <div className="absolute left-[15px] top-10 h-[calc(100%-0.25rem)] w-px bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />
                ) : null}
                <div className="absolute left-0 top-1.5 flex size-7 items-center justify-center rounded-full border border-blue-200 bg-white shadow-[0_12px_24px_rgba(37,99,235,0.12)] sm:size-8">
                  <div className="size-2 rounded-full bg-blue-600 sm:size-2.5" />
                </div>
                <div className={`${index === analysis.timeline.length - 1 ? "" : "pb-6 sm:pb-8"}`}>
                  <div className={sectionLabelClass}>{item.date}</div>
                  <div className="mt-2 text-base font-semibold tracking-[-0.02em] text-slate-950 sm:text-lg">
                    {item.title}
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">
                    {item.detail}
                  </p>
                  <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 sm:mt-4 sm:px-3 sm:text-xs">
                    {item.source}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={analysisCardClass}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[1.1rem] bg-blue-100 text-blue-700 shadow-[0_18px_38px_rgba(59,130,246,0.12)] sm:size-11 sm:rounded-2xl">
              <CheckCircle2 className="size-4 sm:size-5" />
            </div>
            <div className="space-y-1">
              <CardDescription>Core dispute record</CardDescription>
              <CardTitle className="text-[1.45rem] sm:text-[1.7rem]">Extracted facts</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 pt-4 sm:space-y-4 sm:pt-5">
          <div className="space-y-3">
            {factRows.map((fact) => {
              const Icon = fact.icon;

              return (
                <div key={fact.label} className={analysisPanelClass}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex size-9 items-center justify-center rounded-[1.1rem] bg-white text-slate-950 shadow-[0_10px_22px_rgba(15,23,42,0.05)] sm:size-10 sm:rounded-2xl">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={sectionLabelClass}>{fact.label}</div>
                      <div className="mt-1.5 text-[13px] font-semibold leading-5 text-slate-950 sm:mt-2 sm:text-sm sm:leading-6">
                        {fact.value}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {score ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-3.5 sm:rounded-[1.5rem] sm:p-4">
                <div className={sectionLabelClass}>Evidence strength</div>
                <div className="mt-1.5 text-[13px] font-semibold text-slate-950 sm:mt-2 sm:text-sm">
                  {formatLevel(score.evidence_strength)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-3.5 sm:rounded-[1.5rem] sm:p-4">
                <div className={sectionLabelClass}>Urgency</div>
                <div className="mt-1.5 text-[13px] font-semibold text-slate-950 sm:mt-2 sm:text-sm">
                  {formatLevel(score.urgency)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-3.5 sm:rounded-[1.5rem] sm:p-4">
                <div className={sectionLabelClass}>Case readiness</div>
                <div className="mt-1.5 text-[13px] font-semibold text-slate-950 sm:mt-2 sm:text-sm">
                  {score.case_readiness.label} {score.case_readiness.percentage}%
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/75 p-4 sm:rounded-[1.5rem] sm:p-5">
            <div className={sectionLabelClass}>Current issue state</div>
            <p className="mt-2.5 text-[13px] leading-6 text-blue-950 sm:mt-3 sm:text-sm sm:leading-7">
              {facts?.issue_state ??
                analysis.extractedFacts.find((fact) => fact.label === "Current issue state")?.value ??
                "Current issue state not available."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={analysisCardClass}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[1.1rem] bg-amber-100 text-amber-700 shadow-[0_18px_38px_rgba(245,158,11,0.16)] sm:size-11 sm:rounded-2xl">
              <AlertCircle className="size-4 sm:size-5" />
            </div>
            <div className="space-y-1">
              <CardDescription>Proof gaps</CardDescription>
              <CardTitle className="text-[1.45rem] sm:text-[1.7rem]">Missing evidence</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 pt-4 sm:space-y-4 sm:pt-5">
          <p className="text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">
            These additions will make the complaint file more persuasive before you escalate to a
            bank, merchant, or regulator.
          </p>

          <div className="space-y-3">
            {analysis.missingEvidence.map((item) => {
              const style = priorityStyles[item.priority];
              const Icon = style.icon;

              return (
                <div key={item.item} className={analysisPanelClass}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex size-9 items-center justify-center rounded-[1.1rem] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.05)] sm:size-10 sm:rounded-2xl">
                      <Icon className={`size-4 ${style.iconClassName}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[13px] font-semibold leading-5 text-slate-950 sm:text-sm sm:leading-6">
                          {item.item}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${style.badgeClassName}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className={`${analysisCardClass} xl:col-span-2`}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[1.1rem] bg-emerald-100 text-emerald-700 shadow-[0_18px_38px_rgba(16,185,129,0.14)] sm:size-11 sm:rounded-2xl">
              <FileText className="size-4 sm:size-5" />
            </div>
            <div className="space-y-1">
              <CardDescription>Generated response</CardDescription>
              <CardTitle className="text-[1.45rem] sm:text-[1.7rem]">Complaint draft</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-5">
          <div className="rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] sm:rounded-[1.75rem] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-2">
                <div className={sectionLabelClass}>Subject line</div>
                <div className="max-w-3xl text-base font-semibold leading-6 tracking-[-0.02em] text-slate-950 sm:text-lg sm:leading-7">
                  {analysis.complaintDraft.subject}
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <Badge variant="success">Generated draft</Badge>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleCopyComplaint}
                  className="w-full sm:w-auto sm:min-w-[8.5rem]"
                >
                  <ClipboardCheck className="size-4" />
                  {isCopyingDraft ? "Copying..." : "Copy draft"}
                </Button>
              </div>
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-slate-200/80 bg-white/95 p-4 sm:mt-6 sm:rounded-[1.55rem] sm:p-6">
              <div className={sectionLabelClass}>Draft message</div>
              <div className="mt-3.5 space-y-3.5 text-[14px] leading-7 text-slate-700 sm:mt-4 sm:space-y-4 sm:text-[15px] sm:leading-8">
                <p>{analysis.complaintDraft.opening}</p>
                {analysis.complaintDraft.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/85 p-4 sm:mt-5 sm:rounded-[1.5rem] sm:p-5">
              <div className={sectionLabelClass}>Requested resolution</div>
              <div className="mt-3.5 space-y-3 sm:mt-4">
                {analysis.complaintDraft.requestedResolution.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 size-4 text-emerald-600" />
                    <div className="text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200/80 pt-4 sm:mt-5 sm:pt-5">
              <div className={sectionLabelClass}>Closing</div>
              <p className="mt-2.5 text-[14px] leading-7 text-slate-700 sm:mt-3 sm:text-[15px] sm:leading-8">
                {analysis.complaintDraft.closing}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
