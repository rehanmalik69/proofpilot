import "server-only";

import { createAnalysisOutputFromStructuredPayload } from "@/lib/analysis-transform";
import { getCaseStatusLabel } from "@/lib/constants/case-status";
import { normalizeCaseStatus } from "@/lib/constants/case-status";
import { normalizeIssueLanguage } from "@/lib/local-analysis-language";
import type {
  AnalysisOutput,
  AnalysisScore,
  CaseRecord,
  EvidenceFileRecord,
  ExtractedEvidenceText,
  StructuredAnalysisPayload,
} from "@/lib/types/domain";
import { formatCurrency, formatDate } from "@/lib/utils";

type AnalysisGenerationParams = {
  caseItem: CaseRecord;
  evidenceFiles: EvidenceFileRecord[];
  extractedEvidenceTexts?: ExtractedEvidenceText[];
};

type AnalysisGenerationResult = {
  analysis: AnalysisOutput;
  message: string;
};

type DisputeCategory =
  | "refund"
  | "unauthorized"
  | "damaged"
  | "delivery"
  | "billing"
  | "subscription"
  | "service"
  | "generic";

type EvidenceProfile = {
  fileCount: number;
  imageCount: number;
  pdfCount: number;
  textCount: number;
  extractedTextFileCount: number;
  hasImage: boolean;
  hasPdf: boolean;
  hasText: boolean;
  hasCommunication: boolean;
  hasInvoiceLike: boolean;
  hasRefundProof: boolean;
  hasDeliveryProof: boolean;
  hasDamageProof: boolean;
  hasBankStatement: boolean;
};

type EvidenceContentInsights = {
  extractedFileCount: number;
  hasExtractedText: boolean;
  hasOrderConfirmationText: boolean;
  hasMerchantCommunicationText: boolean;
  hasRefundDiscussionText: boolean;
  hasDeliveryUpdateText: boolean;
  hasAuthenticityConcernText: boolean;
  hasQualityProblemText: boolean;
  hasBillingReferenceText: boolean;
  summaryLabels: string[];
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic"];
const PDF_EXTENSIONS = [".pdf"];
const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".eml"];
export const LOCAL_ANALYSIS_ENGINE_VERSION = "proofpilot-local-v2";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createSeed(input: string) {
  return Array.from(input).reduce((total, character) => total + character.charCodeAt(0), 0);
}

function pickVariant(options: string[], seed: number) {
  return options[seed % options.length];
}

function truncateSentence(value: string, maxLength: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}.`;
}

function formatSupportingFileAttachment(count: number) {
  if (count === 0) {
    return "No supporting files are currently attached";
  }

  if (count === 1) {
    return "1 supporting file is currently attached";
  }

  return `${count} supporting files are currently attached`;
}

function formatDocumentCount(count: number) {
  return `${count} uploaded document${count === 1 ? "" : "s"}`;
}

function joinWithAnd(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getFileSignal(file: EvidenceFileRecord) {
  return `${file.file_name} ${file.mime_type ?? ""}`.toLowerCase();
}

function matchesExtension(fileName: string, extensions: string[]) {
  const lower = fileName.toLowerCase();
  return extensions.some((extension) => lower.endsWith(extension));
}

function normalizeEvidenceSignalText(value: string) {
  return value.replace(/\s+/g, " ").toLowerCase().trim();
}

function buildEvidenceContentInsights(
  extractedEvidenceTexts: ExtractedEvidenceText[] = [],
): EvidenceContentInsights {
  const normalizedTexts = extractedEvidenceTexts.map((item) => normalizeEvidenceSignalText(item.text));
  const hasSignal = (keywords: string[]) =>
    normalizedTexts.some((text) => keywords.some((keyword) => text.includes(keyword)));

  const hasOrderConfirmationText = hasSignal([
    "order confirmation",
    "order number",
    "purchase confirmation",
    "transaction id",
    "payment confirmation",
    "receipt",
    "invoice",
    "item subtotal",
    "total paid",
  ]);
  const hasMerchantCommunicationText = hasSignal([
    "thank you for contacting",
    "customer support",
    "customer service",
    "support team",
    "reply",
    "response",
    "dear customer",
    "we apologize",
    "regards",
    "sincerely",
    "chat transcript",
    "message thread",
  ]);
  const hasRefundDiscussionText = hasSignal([
    "refund",
    "refunded",
    "refund request",
    "refund will",
    "refund has",
    "return request",
    "credit issued",
    "reimbursement",
    "refund denied",
    "refund refused",
  ]);
  const hasDeliveryUpdateText = hasSignal([
    "tracking",
    "shipment",
    "shipping update",
    "delivered",
    "out for delivery",
    "delivery date",
    "carrier",
    "package",
    "fulfillment",
    "dispatch",
  ]);
  const hasAuthenticityConcernText = hasSignal([
    "counterfeit",
    "fake",
    "not authentic",
    "not genuine",
    "replica",
    "imitation",
    "authenticity",
    "different from advertised",
  ]);
  const hasQualityProblemText = hasSignal([
    "damaged",
    "defective",
    "faulty",
    "broken",
    "cracked",
    "poor quality",
    "quality issue",
    "smelly",
    "odor",
    "spoiled",
    "expired",
    "contaminated",
    "not as described",
    "wrong item",
  ]);
  const hasBillingReferenceText = hasSignal([
    "charged",
    "billing",
    "statement",
    "transaction amount",
    "amount paid",
    "card ending",
    "payment posted",
    "invoice total",
    "bank",
    "receipt",
  ]);

  const summaryLabels = Array.from(
    new Set(
      [
        hasOrderConfirmationText ? "transaction details" : null,
        hasMerchantCommunicationText ? "merchant communications" : null,
        hasRefundDiscussionText ? "refund-related correspondence" : null,
        hasDeliveryUpdateText ? "delivery status updates" : null,
        hasAuthenticityConcernText ? "authenticity concerns" : null,
        hasQualityProblemText ? "documented quality concerns" : null,
        hasBillingReferenceText ? "billing references" : null,
      ].filter((item): item is string => Boolean(item)),
    ),
  ).slice(0, 4);

  return {
    extractedFileCount: extractedEvidenceTexts.length,
    hasExtractedText: extractedEvidenceTexts.length > 0,
    hasOrderConfirmationText,
    hasMerchantCommunicationText,
    hasRefundDiscussionText,
    hasDeliveryUpdateText,
    hasAuthenticityConcernText,
    hasQualityProblemText,
    hasBillingReferenceText,
    summaryLabels,
  };
}

function buildEvidenceProfile(
  evidenceFiles: EvidenceFileRecord[],
  contentInsights: EvidenceContentInsights,
): EvidenceProfile {
  const signals = evidenceFiles.map(getFileSignal);
  const fileNames = evidenceFiles.map((file) => file.file_name.toLowerCase());
  const mimeTypes = evidenceFiles.map((file) => file.mime_type?.toLowerCase() ?? "");

  const imageCount = evidenceFiles.filter(
    (file) =>
      file.mime_type?.toLowerCase().startsWith("image/") ||
      matchesExtension(file.file_name, IMAGE_EXTENSIONS),
  ).length;
  const pdfCount = evidenceFiles.filter(
    (file) =>
      file.mime_type?.toLowerCase().includes("pdf") || matchesExtension(file.file_name, PDF_EXTENSIONS),
  ).length;
  const textCount = evidenceFiles.filter(
    (file) =>
      file.mime_type?.toLowerCase().startsWith("text/") ||
      matchesExtension(file.file_name, TEXT_EXTENSIONS),
  ).length;

  const hasKeyword = (keywords: string[]) =>
    signals.some((signal) => keywords.some((keyword) => signal.includes(keyword)));

  const hasCommunication =
    hasKeyword(["email", "chat", "message", "thread", "support", "conversation", "correspondence"]) ||
    contentInsights.hasMerchantCommunicationText;
  const hasInvoiceLike =
    hasKeyword(["invoice", "receipt", "order", "statement", "bill", "confirmation", "transaction"]) ||
    contentInsights.hasOrderConfirmationText ||
    contentInsights.hasBillingReferenceText;
  const hasRefundProof =
    hasKeyword(["refund", "return", "refusal", "denied", "cancel", "cancellation"]) ||
    contentInsights.hasRefundDiscussionText;
  const hasDeliveryProof =
    hasKeyword(["delivery", "tracking", "shipment", "shipping", "dispatch"]) ||
    contentInsights.hasDeliveryUpdateText;
  const hasDamageProof =
    hasKeyword(["damage", "damaged", "broken", "crack", "defect", "photo", "image"]) ||
    contentInsights.hasQualityProblemText ||
    contentInsights.hasAuthenticityConcernText;
  const hasBankStatement =
    hasKeyword(["statement", "bank", "card", "charge"]) ||
    fileNames.some((name) => name.includes("statement")) ||
    mimeTypes.some((mimeType) => mimeType.includes("pdf")) ||
    contentInsights.hasBillingReferenceText;

  return {
    fileCount: evidenceFiles.length,
    imageCount,
    pdfCount,
    textCount,
    extractedTextFileCount: contentInsights.extractedFileCount,
    hasImage: imageCount > 0,
    hasPdf: pdfCount > 0,
    hasText: textCount > 0,
    hasCommunication,
    hasInvoiceLike,
    hasRefundProof,
    hasDeliveryProof,
    hasDamageProof,
    hasBankStatement,
  };
}

function resolveDisputeCategory(caseItem: CaseRecord): DisputeCategory {
  const signal = `${caseItem.dispute_type} ${caseItem.issue_description}`.toLowerCase();

  if (
    signal.includes("unauthorized") ||
    signal.includes("fraud") ||
    signal.includes("scam") ||
    signal.includes("charge not mine")
  ) {
    return "unauthorized";
  }

  if (signal.includes("refund") || signal.includes("return") || signal.includes("refund not received")) {
    return "refund";
  }

  if (
    signal.includes("damaged") ||
    signal.includes("defect") ||
    signal.includes("broken") ||
    signal.includes("not as described")
  ) {
    return "damaged";
  }

  if (
    signal.includes("delivery") ||
    signal.includes("shipping") ||
    signal.includes("package") ||
    signal.includes("missing item")
  ) {
    return "delivery";
  }

  if (
    signal.includes("billing") ||
    signal.includes("overcharge") ||
    signal.includes("double charge") ||
    signal.includes("duplicate")
  ) {
    return "billing";
  }

  if (
    signal.includes("subscription") ||
    signal.includes("renewal") ||
    signal.includes("cancellation")
  ) {
    return "subscription";
  }

  if (signal.includes("service") || signal.includes("contract")) {
    return "service";
  }

  return "generic";
}

function inferSeverityLevel(
  caseItem: CaseRecord,
  category: DisputeCategory,
  contentInsights: EvidenceContentInsights,
) {
  const description = caseItem.issue_description.toLowerCase();
  const amount = Number(caseItem.transaction_amount ?? 0);

  let score = 0;

  if (category === "unauthorized") {
    score += 3;
  }

  if (category === "damaged" || category === "delivery" || category === "refund") {
    score += 1;
  }

  if (amount >= 1000) {
    score += 3;
  } else if (amount >= 300) {
    score += 2;
  } else if (amount >= 75) {
    score += 1;
  }

  if (
    [
      "urgent",
      "fraud",
      "unauthorized",
      "scam",
      "ignored",
      "no response",
      "failed",
      "broken",
      "damaged",
    ].some((keyword) => description.includes(keyword))
  ) {
    score += 1;
  }

  if (contentInsights.hasAuthenticityConcernText || contentInsights.hasQualityProblemText) {
    score += 1;
  }

  if (contentInsights.hasRefundDiscussionText && category === "refund") {
    score += 1;
  }

  if (score >= 5) {
    return "High";
  }

  if (score >= 2) {
    return "Medium";
  }

  return "Low";
}

function inferEvidenceStrength(
  profile: EvidenceProfile,
  category: DisputeCategory,
  contentInsights: EvidenceContentInsights,
): AnalysisScore["evidence_strength"] {
  let score = 10;

  score += Math.min(profile.fileCount, 4) * 10;
  score += Math.min(contentInsights.extractedFileCount, 3) * 6;

  if (profile.hasInvoiceLike) {
    score += 20;
  }

  if (profile.hasCommunication) {
    score += 18;
  }

  if (profile.hasPdf) {
    score += 12;
  }

  if (contentInsights.hasOrderConfirmationText) {
    score += 10;
  }

  if (contentInsights.hasMerchantCommunicationText) {
    score += 12;
  }

  if ((category === "damaged" || category === "delivery") && profile.hasImage) {
    score += 20;
  }

  if (category === "refund" && (profile.hasRefundProof || contentInsights.hasRefundDiscussionText)) {
    score += 15;
  }

  if (category === "delivery" && contentInsights.hasDeliveryUpdateText) {
    score += 8;
  }

  if (
    (category === "damaged" || category === "generic") &&
    (contentInsights.hasQualityProblemText || contentInsights.hasAuthenticityConcernText)
  ) {
    score += 8;
  }

  if (
    (category === "unauthorized" || category === "billing") &&
    (profile.hasBankStatement || contentInsights.hasBillingReferenceText)
  ) {
    score += 15;
  }

  if (score >= 70) {
    return "strong";
  }

  if (score >= 40) {
    return "moderate";
  }

  return "weak";
}

function inferUrgency(
  caseItem: CaseRecord,
  category: DisputeCategory,
  severityLevel: "Low" | "Medium" | "High",
  contentInsights: EvidenceContentInsights,
): AnalysisScore["urgency"] {
  const description = caseItem.issue_description.toLowerCase();
  const amount = Number(caseItem.transaction_amount ?? 0);
  const incidentDate = caseItem.incident_date ? new Date(caseItem.incident_date) : null;
  const normalizedStatus = normalizeCaseStatus(caseItem.status);

  let score = 0;

  if (category === "unauthorized") {
    score += 2;
  }

  if (severityLevel === "High") {
    score += 2;
  } else if (severityLevel === "Medium") {
    score += 1;
  }

  if (amount >= 500) {
    score += 1;
  }

  if (
    [
      "urgent",
      "immediately",
      "fraud",
      "unauthorized",
      "chargeback",
      "ignored",
      "still waiting",
      "no response",
    ].some((keyword) => description.includes(keyword))
  ) {
    score += 1;
  }

  if (incidentDate && !Number.isNaN(incidentDate.getTime())) {
    const elapsedDays = Math.floor((Date.now() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (elapsedDays >= 30) {
      score += 1;
    }
  }

  if (contentInsights.hasRefundDiscussionText && normalizedStatus !== "resolved") {
    score += 1;
  }

  if (contentInsights.hasAuthenticityConcernText && category === "damaged") {
    score += 1;
  }

  if (normalizedStatus === "draft" || normalizedStatus === "under_review") {
    score += 1;
  }

  if (score >= 4) {
    return "high";
  }

  if (score >= 2) {
    return "medium";
  }

  return "low";
}

function buildMissingEvidence(
  category: DisputeCategory,
  profile: EvidenceProfile,
  contentInsights: EvidenceContentInsights,
) {
  const suggestions: string[] = [];

  if (!profile.hasInvoiceLike && !profile.hasPdf && !contentInsights.hasOrderConfirmationText) {
    suggestions.push("Order receipt, invoice, or payment confirmation");
  }

  if (!profile.hasCommunication && !contentInsights.hasMerchantCommunicationText) {
    suggestions.push("Email, chat, or other merchant communication record");
  }

  if ((category === "damaged" || category === "delivery") && !profile.hasImage) {
    suggestions.push("Photo or screenshot showing the item condition or delivery issue");
  }

  if (category === "refund" && !profile.hasRefundProof && !contentInsights.hasRefundDiscussionText) {
    suggestions.push("Refund promise, cancellation confirmation, or refund refusal proof");
  }

  if (category === "unauthorized" && !profile.hasBankStatement && !contentInsights.hasBillingReferenceText) {
    suggestions.push("Card or bank statement highlighting the disputed charge");
  }

  if (category === "delivery" && !profile.hasDeliveryProof && !contentInsights.hasDeliveryUpdateText) {
    suggestions.push("Tracking page, delivery confirmation, or shipping timeline screenshot");
  }

  if (category === "billing" && !profile.hasBankStatement && !contentInsights.hasBillingReferenceText) {
    suggestions.push("Billing statement or ledger showing the disputed amount");
  }

  if (
    category === "subscription" &&
    !profile.hasRefundProof &&
    !contentInsights.hasRefundDiscussionText
  ) {
    suggestions.push("Cancellation request and renewal or billing notice");
  }

  if (profile.fileCount === 0) {
    suggestions.unshift("At least one supporting file that anchors the transaction or complaint history");
  }

  if (suggestions.length === 0) {
    suggestions.push("Final written merchant response confirming the dispute outcome");
  }

  return Array.from(new Set(suggestions)).slice(0, 4);
}

function buildReadiness(
  profile: EvidenceProfile,
  evidenceStrength: AnalysisScore["evidence_strength"],
  missingEvidenceCount: number,
  contentInsights: EvidenceContentInsights,
) {
  let percentage = 28;

  percentage += Math.min(profile.fileCount, 4) * 8;
  percentage += profile.hasInvoiceLike ? 16 : 0;
  percentage += profile.hasCommunication ? 14 : 0;
  percentage += profile.hasImage ? 10 : 0;
  percentage += contentInsights.hasExtractedText ? 8 : 0;
  percentage += contentInsights.hasMerchantCommunicationText ? 8 : 0;
  percentage += contentInsights.hasOrderConfirmationText ? 8 : 0;
  percentage += evidenceStrength === "strong" ? 15 : evidenceStrength === "moderate" ? 7 : 0;
  percentage -= missingEvidenceCount * 6;

  const clamped = clamp(percentage, 18, 96);

  if (clamped >= 78) {
    return {
      label: "Ready to escalate",
      percentage: clamped,
    };
  }

  if (clamped >= 55) {
    return {
      label: "Building record",
      percentage: clamped,
    };
  }

  return {
    label: "Needs evidence",
    percentage: clamped,
  };
}

function buildExtractedTextSentence(contentInsights: EvidenceContentInsights) {
  if (!contentInsights.hasExtractedText) {
    return null;
  }

  const descriptors =
    contentInsights.summaryLabels.length > 0
      ? joinWithAnd(contentInsights.summaryLabels)
      : "documentary support relevant to the complaint";

  return `Text extracted from ${formatDocumentCount(contentInsights.extractedFileCount)} reflects ${descriptors}.`;
}

function buildIssueState(
  caseItem: CaseRecord,
  evidenceStrength: AnalysisScore["evidence_strength"],
  urgency: AnalysisScore["urgency"],
  readinessLabel: string,
  contentInsights: EvidenceContentInsights,
) {
  const statusLabel = getCaseStatusLabel(caseItem.status);
  const disputeType = caseItem.dispute_type.toLowerCase();
  const extractedTextSentence = buildExtractedTextSentence(contentInsights);

  return `${statusLabel} with ${evidenceStrength} evidence support, ${urgency} urgency, and a ${readinessLabel.toLowerCase()} complaint posture for this ${disputeType}.${extractedTextSentence ? ` ${extractedTextSentence}` : ""}`;
}

function buildEvidenceSummary(profile: EvidenceProfile, contentInsights: EvidenceContentInsights) {
  const parts = Array.from(
    new Set(
      [
        profile.hasInvoiceLike || profile.hasPdf ? "transaction details" : null,
        profile.hasCommunication ? "merchant communications" : null,
        profile.hasImage ? "visual proof" : null,
        contentInsights.hasRefundDiscussionText ? "refund-related correspondence" : null,
        contentInsights.hasDeliveryUpdateText ? "delivery status updates" : null,
        contentInsights.hasAuthenticityConcernText ? "authenticity concerns" : null,
        contentInsights.hasQualityProblemText ? "documented quality concerns" : null,
      ].filter((item): item is string => Boolean(item)),
    ),
  );

  if (parts.length === 0) {
    return "case details only";
  }

  return joinWithAnd(parts);
}

function buildTimeline(
  caseItem: CaseRecord,
  category: DisputeCategory,
  profile: EvidenceProfile,
  urgency: AnalysisScore["urgency"],
  readinessLabel: string,
  normalizedIssue: ReturnType<typeof normalizeIssueLanguage>,
  contentInsights: EvidenceContentInsights,
) {
  const merchant = caseItem.merchant_name;
  const incidentDate = formatDate(caseItem.incident_date);
  const statusLabel = getCaseStatusLabel(caseItem.status);
  const summaryIssue = truncateSentence(normalizedIssue.cleanedIssue, 150);

  const incidentEventByCategory: Record<DisputeCategory, string> = {
    refund: `The available record indicates that a transaction with ${merchant} later developed into an unresolved refund-related dispute around ${incidentDate}.`,
    unauthorized: `The available record indicates that a transaction connected to ${merchant} was later flagged as potentially unauthorized around ${incidentDate}.`,
    damaged: `The available record indicates that a product or service issue involving ${merchant} was identified around ${incidentDate}.`,
    delivery: `The available record indicates that a delivery or fulfillment issue involving ${merchant} was identified around ${incidentDate}.`,
    billing: `The available record indicates that a billing discrepancy involving ${merchant} was identified around ${incidentDate}.`,
    subscription: `The available record indicates that a subscription or renewal issue involving ${merchant} surfaced around ${incidentDate}.`,
    service: `The available record indicates that a service-related dispute involving ${merchant} began around ${incidentDate}.`,
    generic: `The case record indicates that the dispute with ${merchant} began around ${incidentDate}.`,
  };

  const incidentEvent =
    contentInsights.hasOrderConfirmationText || contentInsights.hasBillingReferenceText
      ? `Uploaded documents appear to confirm the underlying transaction with ${merchant}, after which the matter progressed into the present dispute around ${incidentDate}.`
      : incidentEventByCategory[category];

  const extractedTextSentence = buildExtractedTextSentence(contentInsights);
  const evidenceEvent =
    profile.fileCount > 0
      ? extractedTextSentence
        ? `${formatSupportingFileAttachment(profile.fileCount)}. ${extractedTextSentence} This strengthens the documented record for the complaint.`
        : profile.hasCommunication
          ? `${formatSupportingFileAttachment(profile.fileCount)}. The current evidence inventory includes ${buildEvidenceSummary(profile, contentInsights)}, which strengthens the merchant-response record.`
          : `${formatSupportingFileAttachment(profile.fileCount)}. The case now has a documented evidence inventory built from ${buildEvidenceSummary(profile, contentInsights)}.`
      : "No supporting files have been uploaded yet, so the matter currently relies on the intake record alone.";

  const evidenceEventLabel =
    profile.fileCount === 0
      ? "Evidence gap"
      : contentInsights.hasMerchantCommunicationText
        ? "Correspondence reviewed"
        : contentInsights.hasExtractedText
          ? "Document text reviewed"
          : "Evidence uploaded";

  return [
    {
      date: incidentDate,
      event: incidentEvent,
    },
    {
      date: "Issue identified",
      event: `The issue has been documented in professional terms as follows: ${summaryIssue}`,
    },
    {
      date: evidenceEventLabel,
      event: evidenceEvent,
    },
    {
      date: "Complaint summary prepared",
      event: `ProofPilot prepared a ${urgency}-urgency complaint summary while the case remains ${statusLabel.toLowerCase()} and ${readinessLabel.toLowerCase()}.`,
    },
  ];
}

function buildComplaintDraft(
  caseItem: CaseRecord,
  category: DisputeCategory,
  severityLevel: "Low" | "Medium" | "High",
  score: AnalysisScore,
  profile: EvidenceProfile,
  normalizedIssue: ReturnType<typeof normalizeIssueLanguage>,
  contentInsights: EvidenceContentInsights,
) {
  const merchant = caseItem.merchant_name;
  const amount = formatCurrency(caseItem.transaction_amount);
  const incidentDate = formatDate(caseItem.incident_date);
  const seed = createSeed(`${caseItem.title}${merchant}${caseItem.dispute_type}`);

  const openingByCategory: Record<DisputeCategory, string[]> = {
    refund: [
      `I am writing to request a formal review of an unresolved refund issue involving ${merchant}.`,
      `I am submitting this complaint because a refund-related dispute with ${merchant} remains unresolved.`,
    ],
    unauthorized: [
      `I am filing a complaint regarding a transaction with ${merchant} that appears to be unauthorized.`,
      `I am requesting urgent review of a disputed charge connected to ${merchant} that I do not recognize as authorized.`,
    ],
    damaged: [
      `I am raising a complaint regarding a damaged or defective transaction outcome involving ${merchant}.`,
      `I am submitting this complaint because the goods or services provided by ${merchant} appear to have been defective or damaged.`,
    ],
    delivery: [
      `I am writing to complain about an unresolved delivery issue involving ${merchant}.`,
      `I am submitting this complaint because a delivery-related dispute with ${merchant} remains unresolved.`,
    ],
    billing: [
      `I am requesting review of a billing discrepancy involving ${merchant}.`,
      `I am submitting this complaint because the billing associated with ${merchant} appears to be incorrect.`,
    ],
    subscription: [
      `I am writing to complain about an unresolved subscription or renewal issue involving ${merchant}.`,
      `I am requesting review of a subscription-related billing issue connected to ${merchant}.`,
    ],
    service: [
      `I am submitting a complaint regarding an unresolved service issue involving ${merchant}.`,
      `I am requesting review of a service-related dispute connected to ${merchant}.`,
    ],
    generic: [
      `I am writing to raise a formal complaint concerning ${merchant}.`,
      `I am requesting a written review of the unresolved dispute involving ${merchant}.`,
    ],
  };

  const impactLine =
    severityLevel === "High"
      ? `This matter is materially significant because it involves ${amount} and presents as a high-severity dispute.`
      : severityLevel === "Medium"
        ? `The matter involves ${amount} and has developed into a meaningful consumer dispute that still requires formal resolution.`
        : `The dispute concerns ${amount} and remains unresolved enough to warrant a documented written response.`;

  const extractedTextSentence = buildExtractedTextSentence(contentInsights);
  const evidenceLine =
    profile.fileCount > 0
      ? `I have attached ${profile.fileCount} supporting file${profile.fileCount === 1 ? "" : "s"}, including ${buildEvidenceSummary(profile, contentInsights)}, to support the transaction history and the current status of the complaint.${extractedTextSentence ? ` ${extractedTextSentence}` : ""}`
      : "I have not yet attached supporting files, but the case record already identifies the transaction details and the unresolved issue requiring review.";

  const requestByCategory: Record<DisputeCategory, string> = {
    refund: "Please confirm whether a refund will be issued, the amount to be returned, and the timeline for completion.",
    unauthorized:
      "Please investigate the disputed transaction, confirm whether it will be reversed, and explain what account safeguards or next steps apply.",
    damaged:
      "Please confirm whether the appropriate resolution will be a refund, replacement, or other corrective action, and explain the next steps in writing.",
    delivery:
      "Please confirm the delivery status, explain the failure in fulfillment, and provide the written resolution being offered.",
    billing:
      "Please review the billing error, correct any overcharge, and confirm the adjusted amount in writing.",
    subscription:
      "Please confirm the subscription status, any cancellation or renewal actions, and the refund or credit being offered if charges were improper.",
    service:
      "Please explain the service failure, confirm the remedy being offered, and advise what additional documentation is needed if any.",
    generic:
      "Please review the complaint, confirm the resolution being offered, and advise whether any further documentation is required.",
  };

  const closingByUrgency: Record<AnalysisScore["urgency"], string> = {
    high: "Given the urgency of this matter, I request a prompt written response and a clear resolution path without further delay.",
    medium: "I request a timely written response confirming the review outcome and the next steps for resolution.",
    low: "I would appreciate written confirmation of receipt and a clear summary of the next steps in this review.",
  };

  return [
    pickVariant(openingByCategory[category], seed),
    `The relevant incident date for this matter is ${incidentDate}. ${normalizedIssue.complaintStatement}`,
    impactLine,
    evidenceLine,
    `At this stage, ProofPilot assesses the file as ${score.case_readiness.label.toLowerCase()} with ${score.evidence_strength} evidence strength.`,
    requestByCategory[category],
    closingByUrgency[score.urgency],
  ].join("\n\n");
}

function buildSummary(
  caseItem: CaseRecord,
  score: AnalysisScore,
  profile: EvidenceProfile,
  severityLevel: "Low" | "Medium" | "High",
  normalizedIssue: ReturnType<typeof normalizeIssueLanguage>,
  contentInsights: EvidenceContentInsights,
) {
  const evidenceSummary = buildEvidenceSummary(profile, contentInsights);
  const statusLabel = getCaseStatusLabel(caseItem.status).toLowerCase();
  const extractedTextSentence = buildExtractedTextSentence(contentInsights);

  return `ProofPilot's local analysis indicates that this ${caseItem.dispute_type.toLowerCase()} involving ${caseItem.merchant_name} currently presents as ${severityLevel.toLowerCase()} severity, ${score.urgency} urgency, and ${score.evidence_strength} evidence strength. ${normalizedIssue.analysisStatement}${extractedTextSentence ? ` ${extractedTextSentence}` : ""} The case is presently ${statusLabel} and ${score.case_readiness.label.toLowerCase()} based on ${evidenceSummary}.`;
}

export function buildLocalAnalysisPayload(
  caseItem: CaseRecord,
  evidenceFiles: EvidenceFileRecord[],
  extractedEvidenceTexts: ExtractedEvidenceText[] = [],
): StructuredAnalysisPayload {
  const category = resolveDisputeCategory(caseItem);
  const contentInsights = buildEvidenceContentInsights(extractedEvidenceTexts);
  const profile = buildEvidenceProfile(evidenceFiles, contentInsights);
  const normalizedIssue = normalizeIssueLanguage(
    caseItem.issue_description,
    category,
    caseItem.merchant_name,
  );
  const severityLevel = inferSeverityLevel(caseItem, category, contentInsights);
  const evidenceStrength = inferEvidenceStrength(profile, category, contentInsights);
  const urgency = inferUrgency(caseItem, category, severityLevel, contentInsights);
  const missingEvidence = buildMissingEvidence(category, profile, contentInsights);
  const score: AnalysisScore = {
    evidence_strength: evidenceStrength,
    urgency,
    case_readiness: buildReadiness(
      profile,
      evidenceStrength,
      missingEvidence.length,
      contentInsights,
    ),
  };
  const issueState = buildIssueState(
    caseItem,
    evidenceStrength,
    urgency,
    score.case_readiness.label,
    contentInsights,
  );

  return {
    timeline: buildTimeline(
      caseItem,
      category,
      profile,
      urgency,
      score.case_readiness.label,
      normalizedIssue,
      contentInsights,
    ),
    extracted_facts: {
      merchant_name: caseItem.merchant_name,
      amount_in_dispute: formatCurrency(caseItem.transaction_amount),
      incident_date: formatDate(caseItem.incident_date),
      issue_state: issueState,
      evidence_count: profile.fileCount,
      dispute_type: caseItem.dispute_type,
      severity_level: severityLevel,
    },
    missing_evidence: missingEvidence,
    complaint_draft: buildComplaintDraft(
      caseItem,
      category,
      severityLevel,
      score,
      profile,
      normalizedIssue,
      contentInsights,
    ),
    summary: buildSummary(
      caseItem,
      score,
      profile,
      severityLevel,
      normalizedIssue,
      contentInsights,
    ),
    score,
  };
}

export function createLocalAnalysis(
  caseItem: CaseRecord,
  evidenceFiles: EvidenceFileRecord[],
  extractedEvidenceTexts: ExtractedEvidenceText[] = [],
): AnalysisOutput {
  return createAnalysisOutputFromStructuredPayload({
    caseItem,
    evidenceFiles,
    payload: buildLocalAnalysisPayload(caseItem, evidenceFiles, extractedEvidenceTexts),
    provider: "local",
    model: LOCAL_ANALYSIS_ENGINE_VERSION,
    engineVersion: LOCAL_ANALYSIS_ENGINE_VERSION,
    basis:
      "Generated by ProofPilot's local rules-based analysis engine from the case record, uploaded evidence metadata, and extracted TXT/PDF document text when available.",
  });
}

export async function generateLocalCaseAnalysis({
  caseItem,
  evidenceFiles,
  extractedEvidenceTexts = [],
}: AnalysisGenerationParams): Promise<AnalysisGenerationResult> {
  return {
    analysis: createLocalAnalysis(caseItem, evidenceFiles, extractedEvidenceTexts),
    message: "Local analysis generated from your case details and uploaded evidence files.",
  };
}
