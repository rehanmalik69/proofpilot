import type { Database } from "@/lib/types/database";
import type { CaseStatus } from "@/lib/constants/case-status";

export type NoticeTone = "error" | "success" | "info" | "warning";

export type CaseRecord = Database["public"]["Tables"]["cases"]["Row"];
export type EvidenceFileRecord = Database["public"]["Tables"]["evidence_files"]["Row"];

export type DashboardCase = Pick<
  CaseRecord,
  | "id"
  | "title"
  | "dispute_type"
  | "merchant_name"
  | "status"
  | "created_at"
> & {
  analysisCount: number;
};

export type DashboardActivity = {
  id: string;
  caseId: string;
  title: string;
  description: string;
  createdAt: string;
  kind: "case" | "analysis" | "evidence";
};

export type CaseRecordWithStatus = Omit<CaseRecord, "status"> & {
  status: CaseStatus;
};

export type EvidenceListItem = EvidenceFileRecord & {
  downloadUrl: string | null;
};

export type ExtractedEvidenceText = {
  fileId: string;
  fileName: string;
  fileType: "txt" | "pdf";
  text: string;
  charCount: number;
};

export type AnalysisProvider = "groq" | "openai" | "mock" | "local";

export type AnalysisScore = {
  evidence_strength: "weak" | "moderate" | "strong";
  urgency: "low" | "medium" | "high";
  case_readiness: {
    label: string;
    percentage: number;
  };
};

export type StructuredAnalysisPayload = {
  timeline: Array<{
    date: string;
    event: string;
  }>;
  extracted_facts: {
    merchant_name: string;
    amount_in_dispute: string;
    incident_date: string;
    issue_state: string;
    evidence_count: number;
    dispute_type: string;
    severity_level: "Low" | "Medium" | "High";
  };
  missing_evidence: string[];
  complaint_draft: string;
  summary: string;
  score: AnalysisScore;
};

export type AnalysisOutput = {
  meta?: {
    provider: AnalysisProvider;
    model: string;
    generatedAt: string;
    updatedAt?: string;
    basis: string;
    engineVersion?: string;
    fallbackTriggered?: boolean;
    fallbackReason?: string;
  };
  summary?: string;
  score?: AnalysisScore;
  timeline: Array<{
    date: string;
    title: string;
    detail: string;
    source: string;
  }>;
  extractedFacts: Array<{
    label: string;
    value: string;
    confidence: "High" | "Medium" | "Low";
  }>;
  missingEvidence: Array<{
    item: string;
    reason: string;
    priority: "High" | "Medium" | "Low";
  }>;
  complaintDraft: {
    subject: string;
    opening: string;
    body: string[];
    requestedResolution: string[];
    closing: string;
  };
  rawOutput?: StructuredAnalysisPayload;
};

export type StoredAnalysisRecord = {
  version: 1;
  provider: AnalysisProvider;
  generatedAt: string;
  updatedAt: string;
  engineVersion?: string;
  fallbackReason?: string;
  output: AnalysisOutput;
};
