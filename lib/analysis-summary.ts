import type { AnalysisOutput } from "@/lib/types/domain";

type AnalysisSummaryParams = {
  analysis: AnalysisOutput;
  caseTitle: string;
  caseStatusLabel: string;
};

export function buildComplaintDraftText(analysis: AnalysisOutput) {
  const sections = [
    analysis.complaintDraft.subject,
    "",
    analysis.complaintDraft.opening,
    "",
    ...analysis.complaintDraft.body.flatMap((paragraph) => [paragraph, ""]),
    "Requested resolution:",
    ...analysis.complaintDraft.requestedResolution.map((item) => `- ${item}`),
    "",
    analysis.complaintDraft.closing,
  ];

  return sections.join("\n").trim();
}

export function buildCaseSummaryText({
  analysis,
  caseTitle,
  caseStatusLabel,
}: AnalysisSummaryParams) {
  const facts = analysis.rawOutput?.extracted_facts;
  const score = analysis.score ?? analysis.rawOutput?.score;

  const lines = [
    "ProofPilot Case Summary",
    `Case: ${caseTitle}`,
    `Status: ${caseStatusLabel}`,
    analysis.meta?.generatedAt ? `Generated: ${analysis.meta.generatedAt}` : null,
    analysis.meta?.model ? `Engine: ${analysis.meta.model}` : null,
    analysis.summary ? `Summary: ${analysis.summary}` : null,
    score ? `Evidence strength: ${score.evidence_strength}` : null,
    score ? `Urgency: ${score.urgency}` : null,
    score ? `Case readiness: ${score.case_readiness.label} (${score.case_readiness.percentage}%)` : null,
    "",
    "Extracted Facts",
    facts ? `- Merchant name: ${facts.merchant_name}` : null,
    facts ? `- Amount in dispute: ${facts.amount_in_dispute}` : null,
    facts ? `- Incident date: ${facts.incident_date}` : null,
    facts ? `- Dispute type: ${facts.dispute_type}` : null,
    facts ? `- Severity level: ${facts.severity_level}` : null,
    facts ? `- Current issue state: ${facts.issue_state}` : null,
    facts ? `- Evidence count: ${facts.evidence_count}` : null,
    ...analysis.extractedFacts
      .filter(
        (fact) =>
          ![
            "Merchant name",
            "Amount in dispute",
            "Incident date",
            "Dispute type",
            "Severity level",
            "Case status",
            "Current issue state",
            "Evidence count",
          ].includes(fact.label),
      )
      .map((fact) => `- ${fact.label}: ${fact.value} (${fact.confidence})`),
    "",
    "Missing Evidence",
    ...analysis.missingEvidence.map((item) => `- ${item.item} [${item.priority}]: ${item.reason}`),
  ].filter((line): line is string => typeof line === "string");

  return lines.join("\n");
}

export function buildFullReportText({
  analysis,
  caseTitle,
  caseStatusLabel,
}: AnalysisSummaryParams) {
  const caseSummary = buildCaseSummaryText({ analysis, caseTitle, caseStatusLabel });

  const lines = [
    caseSummary,
    "",
    "Timeline",
    ...analysis.timeline.map(
      (item) => `- ${item.date}: ${item.title} | ${item.detail} | Source: ${item.source}`,
    ),
    "",
    "Complaint Draft",
    buildComplaintDraftText(analysis),
  ];

  return lines.join("\n");
}
