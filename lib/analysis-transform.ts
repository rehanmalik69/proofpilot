import { getCaseStatusLabel } from "@/lib/constants/case-status";
import { normalizeIssueLanguage } from "@/lib/local-analysis-language";
import type {
  AnalysisOutput,
  AnalysisProvider,
  CaseRecord,
  EvidenceFileRecord,
  StructuredAnalysisPayload,
} from "@/lib/types/domain";
import { formatCurrency, formatDate } from "@/lib/utils";

type AnalysisTransformParams = {
  caseItem: CaseRecord;
  evidenceFiles: EvidenceFileRecord[];
  payload: StructuredAnalysisPayload;
  provider: AnalysisProvider;
  model: string;
  basis: string;
  engineVersion?: string;
  fallbackTriggered?: boolean;
  fallbackReason?: string;
};

function normalizeText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildRequestedResolution(
  caseItem: CaseRecord,
  amountInDispute: string,
  payload: StructuredAnalysisPayload,
) {
  const disputeType = payload.extracted_facts.dispute_type.toLowerCase();
  const urgency = payload.score.urgency;

  const firstLine = disputeType.includes("refund") || disputeType.includes("return")
    ? "Confirm whether a refund or credit will be issued and provide the processing timeline."
    : disputeType.includes("unauthorized") || disputeType.includes("fraud")
      ? "Investigate the disputed charge and confirm whether it will be reversed."
      : disputeType.includes("delivery")
        ? "Confirm the delivery status, what failed, and the written resolution being offered."
        : disputeType.includes("subscription") || disputeType.includes("renewal")
          ? "Confirm the subscription status, cancellation position, and any credit or refund owed."
          : disputeType.includes("billing") || disputeType.includes("charge")
            ? "Review the billing discrepancy and confirm the corrected amount in writing."
            : `Review the ${caseItem.dispute_type.toLowerCase()} and confirm the outcome in writing.`;

  return [
    firstLine,
    amountInDispute !== "Not provided"
      ? `Resolve the disputed amount of ${amountInDispute}.`
      : "Clarify the financial remedy or corrective action being offered.",
    urgency === "high"
      ? "Provide a prompt written response because the case has been flagged as high urgency."
      : "Advise what additional documentation is required if the complaint is not yet complete.",
  ];
}

function splitComplaintDraft(
  complaintDraft: string,
  caseItem: CaseRecord,
  amountInDispute: string,
  payload: StructuredAnalysisPayload,
) {
  const paragraphs = splitParagraphs(complaintDraft);
  const normalizedIssue = normalizeIssueLanguage(
    caseItem.issue_description,
    payload.extracted_facts.dispute_type,
    caseItem.merchant_name,
  );
  const subject = `Complaint regarding ${caseItem.merchant_name} (${caseItem.dispute_type})`;
  const opening =
    paragraphs[0] ??
    `I am writing to raise a complaint concerning ${caseItem.merchant_name} and the unresolved ${caseItem.dispute_type.toLowerCase()} described in my case file.`;
  const body =
    paragraphs.length > 2
      ? paragraphs.slice(1, -1)
      : paragraphs.length > 1
        ? paragraphs.slice(1)
        : [
            `The dispute relates to the following issue: ${normalizedIssue.cleanedIssue}`,
            `I am requesting a review of the transaction at issue and the supporting records already attached to this case.`,
          ];
  const closing =
    paragraphs.length > 1
      ? paragraphs[paragraphs.length - 1]
      : "Please confirm receipt of this complaint and let me know what happens next.";

  return {
    subject,
    opening,
    body,
    requestedResolution: buildRequestedResolution(caseItem, amountInDispute, payload),
    closing,
  };
}

function inferTimelineDetail(event: string, index: number, evidenceCount: number) {
  const lower = event.toLowerCase();

  if (lower.includes("purchase") || lower.includes("order") || lower.includes("transaction")) {
    return "This event anchors the underlying transaction context described in the case intake.";
  }

  if (lower.includes("merchant") || lower.includes("support") || lower.includes("response")) {
    return "This marks a merchant-facing interaction that is relevant to the current dispute posture.";
  }

  if (lower.includes("evidence") || lower.includes("upload") || lower.includes("file")) {
    return evidenceCount > 0
      ? `The current evidence inventory includes ${evidenceCount} uploaded file${evidenceCount === 1 ? "" : "s"}, which informs the present analysis posture.`
      : "No evidence files were available when this analysis was generated.";
  }

  if (index === 0) {
    return "This is the earliest material event reflected in the current complaint record.";
  }

  return "This event was inferred from the case details and the available evidence metadata.";
}

function inferMissingEvidenceReason(item: string, index: number) {
  const lower = item.toLowerCase();

  if (lower.includes("receipt") || lower.includes("invoice") || lower.includes("statement")) {
    return "Primary transaction records help verify the merchant, the disputed amount, and the timing of the transaction.";
  }

  if (lower.includes("email") || lower.includes("chat") || lower.includes("message") || lower.includes("response")) {
    return "Written communications help establish notice, representations made, and the current unresolved status of the matter.";
  }

  if (lower.includes("photo") || lower.includes("image") || lower.includes("screenshot")) {
    return "Visual records can materially strengthen the factual record where condition, delivery, or product-description issues are relevant.";
  }

  if (index === 0) {
    return "This appears to be the highest-value missing item for strengthening the file at this stage.";
  }

  return "This would help close a factual gap before the complaint is escalated for external review.";
}

function inferMissingEvidencePriority(item: string, index: number): "High" | "Medium" | "Low" {
  const lower = item.toLowerCase();

  if (
    lower.includes("receipt") ||
    lower.includes("invoice") ||
    lower.includes("statement") ||
    lower.includes("email") ||
    lower.includes("chat") ||
    lower.includes("response")
  ) {
    return "High";
  }

  if (lower.includes("photo") || lower.includes("image") || lower.includes("screenshot")) {
    return "Medium";
  }

  return index === 0 ? "High" : index === 1 ? "Medium" : "Low";
}

export function createAnalysisOutputFromStructuredPayload({
  caseItem,
  evidenceFiles,
  payload,
  provider,
  model,
  basis,
  engineVersion,
  fallbackTriggered,
  fallbackReason,
}: AnalysisTransformParams): AnalysisOutput {
  const amountInDispute = normalizeText(
    payload.extracted_facts.amount_in_dispute,
    formatCurrency(caseItem.transaction_amount),
  );
  const incidentDate = normalizeText(
    payload.extracted_facts.incident_date,
    formatDate(caseItem.incident_date),
  );
  const merchantName = normalizeText(payload.extracted_facts.merchant_name, caseItem.merchant_name);
  const disputeType = normalizeText(payload.extracted_facts.dispute_type, caseItem.dispute_type);
  const severityLevel = normalizeText(payload.extracted_facts.severity_level, "Medium") as
    | "Low"
    | "Medium"
    | "High";
  const issueState = normalizeText(
    payload.extracted_facts.issue_state,
    `${getCaseStatusLabel(caseItem.status)} with ${evidenceFiles.length} evidence file${evidenceFiles.length === 1 ? "" : "s"} attached.`,
  );
  const evidenceCount =
    typeof payload.extracted_facts.evidence_count === "number"
      ? payload.extracted_facts.evidence_count
      : evidenceFiles.length;

  return {
    meta: {
      provider,
      model,
      generatedAt: new Date().toISOString(),
      basis,
      engineVersion,
      fallbackTriggered,
      fallbackReason,
    },
    score: payload.score,
    summary: normalizeText(payload.summary, "Structured analysis generated from the case record."),
    timeline: payload.timeline.map((item, index) => ({
      date: normalizeText(item.date, "Date not specified"),
      title: normalizeText(item.event, "Timeline event"),
      detail: inferTimelineDetail(item.event, index, evidenceCount),
      source:
        provider === "groq"
          ? "Groq analysis"
          : provider === "openai"
          ? "OpenAI analysis"
          : provider === "local"
            ? "Local analysis engine"
            : "Fallback analysis",
    })),
    extractedFacts: [
      { label: "Merchant name", value: merchantName, confidence: "High" },
      { label: "Amount in dispute", value: amountInDispute, confidence: "High" },
      { label: "Incident date", value: incidentDate, confidence: "High" },
      { label: "Dispute type", value: disputeType, confidence: "High" },
      { label: "Severity level", value: severityLevel, confidence: "Medium" },
      { label: "Case status", value: getCaseStatusLabel(caseItem.status), confidence: "High" },
      { label: "Current issue state", value: issueState, confidence: "High" },
      {
        label: "Evidence count",
        value: `${evidenceCount} file${evidenceCount === 1 ? "" : "s"}`,
        confidence: "High",
      },
    ],
    missingEvidence: payload.missing_evidence.map((item, index) => ({
      item: normalizeText(item, "Additional supporting documentation"),
      reason: inferMissingEvidenceReason(item, index),
      priority: inferMissingEvidencePriority(item, index),
    })),
    complaintDraft: splitComplaintDraft(payload.complaint_draft, caseItem, amountInDispute, payload),
    rawOutput: {
      timeline: payload.timeline.map((item) => ({
        date: normalizeText(item.date, "Date not specified"),
        event: normalizeText(item.event, "Timeline event"),
      })),
      extracted_facts: {
        merchant_name: merchantName,
        amount_in_dispute: amountInDispute,
        incident_date: incidentDate,
        issue_state: issueState,
        evidence_count: evidenceCount,
        dispute_type: disputeType,
        severity_level: severityLevel,
      },
      missing_evidence: payload.missing_evidence.map((item) =>
        normalizeText(item, "Additional supporting documentation"),
      ),
      complaint_draft: normalizeText(
        payload.complaint_draft,
        `I am writing to raise a complaint concerning ${caseItem.merchant_name} and the unresolved issue in this case.`,
      ),
      summary: normalizeText(payload.summary, "Structured analysis generated from the case record."),
      score: payload.score,
    },
  };
}
