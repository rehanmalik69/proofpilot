import "server-only";

import OpenAI from "openai";
import { createMockAnalysis } from "@/lib/mock-analysis";
import { createAnalysisOutputFromStructuredPayload } from "@/lib/analysis-transform";
import { getCaseStatusLabel } from "@/lib/constants/case-status";
import type {
  AnalysisOutput,
  CaseRecord,
  EvidenceFileRecord,
  StructuredAnalysisPayload,
} from "@/lib/types/domain";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOpenAIConfig } from "@/lib/openai/env";

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    timeline: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string" },
          event: { type: "string" },
        },
        required: ["date", "event"],
      },
    },
    extracted_facts: {
      type: "object",
      additionalProperties: false,
      properties: {
        merchant_name: { type: "string" },
        amount_in_dispute: { type: "string" },
        incident_date: { type: "string" },
        issue_state: { type: "string" },
        evidence_count: { type: "number" },
      },
      required: [
        "merchant_name",
        "amount_in_dispute",
        "incident_date",
        "issue_state",
        "evidence_count",
      ],
    },
    missing_evidence: {
      type: "array",
      items: { type: "string" },
    },
    complaint_draft: { type: "string" },
    summary: { type: "string" },
  },
  required: [
    "timeline",
    "extracted_facts",
    "missing_evidence",
    "complaint_draft",
    "summary",
  ],
} as const;

type AnalysisGenerationParams = {
  caseItem: CaseRecord;
  evidenceFiles: EvidenceFileRecord[];
};

type AnalysisGenerationResult = {
  analysis: AnalysisOutput;
  message: string;
};

function getEvidenceType(file: EvidenceFileRecord) {
  return file.mime_type || "unknown";
}

function buildEvidenceInventory(evidenceFiles: EvidenceFileRecord[]) {
  if (evidenceFiles.length === 0) {
    return "No evidence files are currently attached to this case.";
  }

  return evidenceFiles
    .map((file, index) => {
      const parts = [
        `${index + 1}. ${file.file_name}`,
        `type=${getEvidenceType(file)}`,
        file.file_size ? `size=${file.file_size} bytes` : null,
      ].filter(Boolean);

      return parts.join(" | ");
    })
    .join("\n");
}

function buildPrompt(caseItem: CaseRecord, evidenceFiles: EvidenceFileRecord[]) {
  return [
    "Build a factual consumer-dispute analysis for ProofPilot.",
    "Use the case details and uploaded evidence metadata only.",
    "Do not assume the content of the uploaded files.",
    "Do not provide legal advice.",
    "If a fact is uncertain, reflect that in the issue state or missing evidence list instead of inventing details.",
    "",
    "Case details:",
    JSON.stringify(
      {
        title: caseItem.title,
        dispute_type: caseItem.dispute_type,
        merchant_name: caseItem.merchant_name,
        issue_description: caseItem.issue_description,
        transaction_amount: formatCurrency(caseItem.transaction_amount),
        incident_date: formatDate(caseItem.incident_date),
        case_status: getCaseStatusLabel(caseItem.status),
      },
      null,
      2,
    ),
    "",
    `Evidence file count: ${evidenceFiles.length}`,
    "Evidence metadata:",
    buildEvidenceInventory(evidenceFiles),
    "",
    "Return structured JSON that matches the provided schema exactly.",
    "Timeline events should be concise and factual.",
    "Complaint draft should be a polished multi-paragraph message suitable as a starting point for a consumer complaint.",
  ].join("\n");
}

function isStructuredAnalysisPayload(value: unknown): value is StructuredAnalysisPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<StructuredAnalysisPayload>;

  return (
    Array.isArray(payload.timeline) &&
    typeof payload.extracted_facts?.merchant_name === "string" &&
    typeof payload.extracted_facts?.amount_in_dispute === "string" &&
    typeof payload.extracted_facts?.incident_date === "string" &&
    typeof payload.extracted_facts?.issue_state === "string" &&
    typeof payload.extracted_facts?.evidence_count === "number" &&
    Array.isArray(payload.missing_evidence) &&
    payload.missing_evidence.every((item) => typeof item === "string") &&
    typeof payload.complaint_draft === "string" &&
    typeof payload.summary === "string"
  );
}

export async function generateCaseAnalysis({
  caseItem,
  evidenceFiles,
}: AnalysisGenerationParams): Promise<AnalysisGenerationResult> {
  const config = getOpenAIConfig();

  if (!config) {
    return {
      analysis: createMockAnalysis(caseItem, evidenceFiles),
      message: "OpenAI is not configured, so ProofPilot saved a fallback mock analysis instead.",
    };
  }

  try {
    const client = new OpenAI({ apiKey: config.apiKey });
    const response = await client.responses.create({
      model: config.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(caseItem, evidenceFiles),
            },
          ],
        },
      ],
      max_output_tokens: 1800,
      text: {
        format: {
          type: "json_schema",
          name: "proofpilot_case_analysis",
          strict: true,
          schema: ANALYSIS_SCHEMA,
        },
      },
    });

    const parsed = JSON.parse(response.output_text);

    if (!isStructuredAnalysisPayload(parsed)) {
      throw new Error("OpenAI returned an unexpected structured payload.");
    }

    return {
      analysis: createAnalysisOutputFromStructuredPayload({
        caseItem,
        evidenceFiles,
        payload: parsed,
        provider: "openai",
        model: config.model,
        basis:
          "Generated from the case record and uploaded evidence metadata using the OpenAI Responses API.",
      }),
      message: `AI analysis generated with ${config.model}.`,
    };
  } catch (error) {
    console.error("OpenAI analysis failed, falling back to mock analysis.", error);

    return {
      analysis: createMockAnalysis(caseItem, evidenceFiles),
      message: "OpenAI analysis failed, so ProofPilot saved a fallback mock analysis instead.",
    };
  }
}
