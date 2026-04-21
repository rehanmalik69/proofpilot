import "server-only";

import OpenAI from "openai";
import { createAnalysisOutputFromStructuredPayload } from "@/lib/analysis-transform";
import { getCaseStatusLabel } from "@/lib/constants/case-status";
import {
  createLocalAnalysis,
  LOCAL_ANALYSIS_ENGINE_VERSION,
} from "@/lib/local-analysis-engine";
import type {
  AnalysisOutput,
  CaseRecord,
  EvidenceFileRecord,
  ExtractedEvidenceText,
  StructuredAnalysisPayload,
} from "@/lib/types/domain";
import { formatCurrency, formatDate } from "@/lib/utils";

type AnalysisProviderParams = {
  caseItem: CaseRecord;
  evidenceFiles: EvidenceFileRecord[];
  extractedEvidenceTexts?: ExtractedEvidenceText[];
};

type AnalysisProviderResult = {
  analysis: AnalysisOutput;
  message: string;
};

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_ANALYSIS_ENGINE_VERSION = "proofpilot-groq-v1";
const GROQ_TIMEOUT_MS = 15000;
const MAX_PROMPT_DOCUMENTS = 4;
const MAX_PROMPT_DOCUMENT_CHARACTERS = 2400;
const MAX_PROMPT_TOTAL_CHARACTERS = 7200;

const GROQ_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "timeline",
    "extracted_facts",
    "missing_evidence",
    "complaint_draft",
    "summary",
    "score",
  ],
  properties: {
    timeline: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "event"],
        properties: {
          date: { type: "string" },
          event: { type: "string" },
        },
      },
    },
    extracted_facts: {
      type: "object",
      additionalProperties: false,
      required: [
        "merchant_name",
        "amount_in_dispute",
        "incident_date",
        "issue_state",
        "evidence_count",
        "dispute_type",
        "severity_level",
      ],
      properties: {
        merchant_name: { type: "string" },
        amount_in_dispute: { type: "string" },
        incident_date: { type: "string" },
        issue_state: { type: "string" },
        evidence_count: { type: "integer" },
        dispute_type: { type: "string" },
        severity_level: {
          type: "string",
          enum: ["Low", "Medium", "High"],
        },
      },
    },
    missing_evidence: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
    },
    complaint_draft: { type: "string" },
    summary: { type: "string" },
    score: {
      type: "object",
      additionalProperties: false,
      required: ["evidence_strength", "urgency", "case_readiness"],
      properties: {
        evidence_strength: {
          type: "string",
          enum: ["weak", "moderate", "strong"],
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        case_readiness: {
          type: "object",
          additionalProperties: false,
          required: ["label", "percentage"],
          properties: {
            label: { type: "string" },
            percentage: {
              type: "integer",
              minimum: 0,
              maximum: 100,
            },
          },
        },
      },
    },
  },
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function truncateText(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeFallbackReason(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("timeout") || message.includes("timed out") || message.includes("abort")) {
    return "Groq request timed out.";
  }

  if (
    message.includes("json") ||
    message.includes("schema") ||
    message.includes("parse") ||
    message.includes("structured")
  ) {
    return "Groq returned invalid structured analysis output.";
  }

  return "Groq analysis was unavailable for this request.";
}

function buildEvidenceMetadata(evidenceFiles: EvidenceFileRecord[]) {
  if (evidenceFiles.length === 0) {
    return "No uploaded evidence files are currently linked to this case.";
  }

  return evidenceFiles
    .map((file, index) => {
      const fileType = file.mime_type?.trim() || "Unknown type";
      const fileSize = typeof file.file_size === "number" ? `${file.file_size} bytes` : "Size unknown";
      return `${index + 1}. ${file.file_name} | ${fileType} | ${fileSize}`;
    })
    .join("\n");
}

function buildExtractedEvidenceContext(extractedEvidenceTexts: ExtractedEvidenceText[]) {
  if (extractedEvidenceTexts.length === 0) {
    return "No extracted TXT or PDF evidence text was available.";
  }

  let remainingCharacters = MAX_PROMPT_TOTAL_CHARACTERS;
  const sections: string[] = [];

  for (const [index, file] of extractedEvidenceTexts.slice(0, MAX_PROMPT_DOCUMENTS).entries()) {
    if (remainingCharacters <= 0) {
      break;
    }

    const excerpt = truncateText(file.text, Math.min(MAX_PROMPT_DOCUMENT_CHARACTERS, remainingCharacters));
    if (!excerpt) {
      continue;
    }

    sections.push(
      [
        `Document ${index + 1}: ${file.fileName}`,
        `Type: ${file.fileType.toUpperCase()}`,
        `Extracted characters: ${file.charCount}`,
        "Excerpt:",
        excerpt,
      ].join("\n"),
    );

    remainingCharacters -= excerpt.length;
  }

  return sections.length > 0
    ? sections.join("\n\n---\n\n")
    : "No extracted TXT or PDF evidence text was available.";
}

function buildGroqPrompt(
  caseItem: CaseRecord,
  evidenceFiles: EvidenceFileRecord[],
  extractedEvidenceTexts: ExtractedEvidenceText[],
) {
  return [
    "Case details",
    `- Title: ${caseItem.title}`,
    `- Dispute type: ${caseItem.dispute_type}`,
    `- Merchant name: ${caseItem.merchant_name}`,
    `- Issue description: ${caseItem.issue_description}`,
    `- Transaction amount: ${formatCurrency(caseItem.transaction_amount)}`,
    `- Incident date: ${formatDate(caseItem.incident_date)}`,
    `- Case status: ${getCaseStatusLabel(caseItem.status)}`,
    "",
    "Evidence metadata",
    `- File count: ${evidenceFiles.length}`,
    buildEvidenceMetadata(evidenceFiles),
    "",
    "Extracted TXT/PDF evidence text",
    buildExtractedEvidenceContext(extractedEvidenceTexts),
    "",
    "Instructions",
    "- Produce a professional consumer-complaint analysis using only the provided information.",
    "- Preserve the meaning of the complaint but rewrite messy, emotional, or unclear wording into formal complaint language.",
    "- If the issue description is unclear, use a safe professional summary rather than repeating unclear wording.",
    "- Mention only evidence that is supported by the metadata or extracted document text.",
    "- Keep the complaint draft polished, serious, and suitable for a merchant, bank, or regulator.",
  ].join("\n");
}

function getRequiredString(
  value: unknown,
  fieldName: string,
  options?: { allowedValues?: string[] },
) {
  if (typeof value !== "string") {
    throw new Error(`Missing string field: ${fieldName}`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Empty string field: ${fieldName}`);
  }

  if (options?.allowedValues && !options.allowedValues.includes(trimmed)) {
    throw new Error(`Invalid value for ${fieldName}`);
  }

  return trimmed;
}

function getInteger(value: unknown, fieldName: string, min?: number, max?: number) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Missing numeric field: ${fieldName}`);
  }

  const rounded = Math.round(numericValue);

  if (typeof min === "number" && rounded < min) {
    throw new Error(`Numeric field below minimum: ${fieldName}`);
  }

  if (typeof max === "number" && rounded > max) {
    throw new Error(`Numeric field above maximum: ${fieldName}`);
  }

  return rounded;
}

function parseStructuredAnalysisPayload(value: unknown): StructuredAnalysisPayload {
  if (!isObject(value)) {
    throw new Error("Groq response did not return an object.");
  }

  if (!Array.isArray(value.timeline) || value.timeline.length === 0) {
    throw new Error("Groq response did not include a valid timeline.");
  }

  if (!isObject(value.extracted_facts)) {
    throw new Error("Groq response did not include extracted facts.");
  }

  if (!isObject(value.score) || !isObject(value.score.case_readiness)) {
    throw new Error("Groq response did not include a valid score block.");
  }

  if (!Array.isArray(value.missing_evidence) || value.missing_evidence.length === 0) {
    throw new Error("Groq response did not include missing evidence suggestions.");
  }

  return {
    timeline: value.timeline.slice(0, 6).map((item, index) => {
      if (!isObject(item)) {
        throw new Error(`Invalid timeline item at index ${index}`);
      }

      return {
        date: getRequiredString(item.date, `timeline[${index}].date`),
        event: getRequiredString(item.event, `timeline[${index}].event`),
      };
    }),
    extracted_facts: {
      merchant_name: getRequiredString(
        value.extracted_facts.merchant_name,
        "extracted_facts.merchant_name",
      ),
      amount_in_dispute: getRequiredString(
        value.extracted_facts.amount_in_dispute,
        "extracted_facts.amount_in_dispute",
      ),
      incident_date: getRequiredString(
        value.extracted_facts.incident_date,
        "extracted_facts.incident_date",
      ),
      issue_state: getRequiredString(
        value.extracted_facts.issue_state,
        "extracted_facts.issue_state",
      ),
      evidence_count: getInteger(
        value.extracted_facts.evidence_count,
        "extracted_facts.evidence_count",
        0,
      ),
      dispute_type: getRequiredString(
        value.extracted_facts.dispute_type,
        "extracted_facts.dispute_type",
      ),
      severity_level: getRequiredString(
        value.extracted_facts.severity_level,
        "extracted_facts.severity_level",
        { allowedValues: ["Low", "Medium", "High"] },
      ) as StructuredAnalysisPayload["extracted_facts"]["severity_level"],
    },
    missing_evidence: value.missing_evidence.slice(0, 5).map((item, index) =>
      getRequiredString(item, `missing_evidence[${index}]`),
    ),
    complaint_draft: getRequiredString(value.complaint_draft, "complaint_draft"),
    summary: getRequiredString(value.summary, "summary"),
    score: {
      evidence_strength: getRequiredString(value.score.evidence_strength, "score.evidence_strength", {
        allowedValues: ["weak", "moderate", "strong"],
      }) as StructuredAnalysisPayload["score"]["evidence_strength"],
      urgency: getRequiredString(value.score.urgency, "score.urgency", {
        allowedValues: ["low", "medium", "high"],
      }) as StructuredAnalysisPayload["score"]["urgency"],
      case_readiness: {
        label: getRequiredString(value.score.case_readiness.label, "score.case_readiness.label"),
        percentage: getInteger(value.score.case_readiness.percentage, "score.case_readiness.percentage", 0, 100),
      },
    },
  };
}

function parseCompletionContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          isObject(part) &&
          part.type === "text" &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function createLocalAnalysisWithMetadata(
  caseItem: CaseRecord,
  evidenceFiles: EvidenceFileRecord[],
  extractedEvidenceTexts: ExtractedEvidenceText[],
  fallbackReason?: string,
) {
  const analysis = createLocalAnalysis(caseItem, evidenceFiles, extractedEvidenceTexts);

  if (!fallbackReason || !analysis.meta) {
    return analysis;
  }

  return {
    ...analysis,
    meta: {
      ...analysis.meta,
      engineVersion: LOCAL_ANALYSIS_ENGINE_VERSION,
      fallbackTriggered: true,
      fallbackReason,
      basis: `${analysis.meta.basis} Groq was unavailable, so ProofPilot saved the local engine result instead.`,
    },
  };
}

async function generateGroqAnalysis(
  caseItem: CaseRecord,
  evidenceFiles: EvidenceFileRecord[],
  extractedEvidenceTexts: ExtractedEvidenceText[],
) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  const client = new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
    timeout: GROQ_TIMEOUT_MS,
  });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are ProofPilot's professional consumer-complaint analyst. Return only structured JSON. Use formal, credible complaint language. Do not repeat slang, profanity, or chaotic wording from the user's raw description. If the facts are incomplete, use safe professional wording rather than inventing unsupported claims.",
      },
      {
        role: "user",
        content: buildGroqPrompt(caseItem, evidenceFiles, extractedEvidenceTexts),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "proofpilot_case_analysis",
        strict: true,
        schema: GROQ_ANALYSIS_SCHEMA,
      },
    },
  });

  const content = parseCompletionContent(completion.choices[0]?.message?.content);
  if (!content) {
    throw new Error("Groq returned an empty analysis response.");
  }

  const payload = parseStructuredAnalysisPayload(JSON.parse(content));

  return createAnalysisOutputFromStructuredPayload({
    caseItem,
    evidenceFiles,
    payload,
    provider: "groq",
    model,
    engineVersion: GROQ_ANALYSIS_ENGINE_VERSION,
    basis:
      "Generated by Groq from the case record, uploaded evidence metadata, and extracted TXT/PDF document text when available.",
  });
}

export async function generateCaseAnalysis({
  caseItem,
  evidenceFiles,
  extractedEvidenceTexts = [],
}: AnalysisProviderParams): Promise<AnalysisProviderResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    return {
      analysis: createLocalAnalysis(caseItem, evidenceFiles, extractedEvidenceTexts),
      message: "Local analysis generated from your case details and uploaded evidence files.",
    };
  }

  try {
    const analysis = await generateGroqAnalysis(caseItem, evidenceFiles, extractedEvidenceTexts);

    if (!analysis) {
      throw new Error("Groq API key is not configured.");
    }

    return {
      analysis,
      message: "Groq analysis generated from your case details and uploaded evidence files.",
    };
  } catch (error) {
    const fallbackReason = normalizeFallbackReason(error);

    console.error("Groq analysis failed. Falling back to the local analysis engine.", {
      caseId: caseItem.id,
      provider: "groq",
      fallbackReason,
      error,
    });

    return {
      analysis: createLocalAnalysisWithMetadata(
        caseItem,
        evidenceFiles,
        extractedEvidenceTexts,
        fallbackReason,
      ),
      message: "Analysis generated using the local engine after the AI provider was unavailable.",
    };
  }
}
