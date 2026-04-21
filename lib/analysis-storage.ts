import type { Json } from "@/lib/types/database";
import type { AnalysisOutput, AnalysisProvider, StoredAnalysisRecord } from "@/lib/types/domain";

const ANALYSIS_STORAGE_VERSION = 1 as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAnalysisOutputLike(value: unknown): value is AnalysisOutput {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.timeline) &&
    Array.isArray(value.extractedFacts) &&
    Array.isArray(value.missingEvidence) &&
    isObject(value.complaintDraft)
  );
}

function isStoredAnalysisRecord(value: unknown): value is StoredAnalysisRecord {
  return (
    isObject(value) &&
    value.version === ANALYSIS_STORAGE_VERSION &&
    typeof value.provider === "string" &&
    typeof value.generatedAt === "string" &&
    typeof value.updatedAt === "string" &&
    isAnalysisOutputLike(value.output)
  );
}

function withPersistedMeta(
  output: AnalysisOutput,
  persistedAt: string,
  provider?: AnalysisProvider,
  engineVersion?: string,
  fallbackReason?: string,
) {
  return {
    ...output,
    meta: output.meta
      ? {
          ...output.meta,
          provider: provider ?? output.meta.provider,
          generatedAt: output.meta.generatedAt || persistedAt,
          updatedAt: persistedAt,
          engineVersion: engineVersion ?? output.meta.engineVersion,
          fallbackReason: fallbackReason ?? output.meta.fallbackReason,
        }
      : undefined,
  };
}

export function createStoredAnalysisRecord(
  output: AnalysisOutput,
  persistedAt = new Date().toISOString(),
): StoredAnalysisRecord {
  const provider = output.meta?.provider ?? "local";
  const generatedAt = output.meta?.generatedAt || persistedAt;
  const normalizedOutput = withPersistedMeta(
    output,
    persistedAt,
    provider,
    output.meta?.engineVersion,
    output.meta?.fallbackReason,
  );

  return {
    version: ANALYSIS_STORAGE_VERSION,
    provider,
    generatedAt,
    updatedAt: persistedAt,
    engineVersion: normalizedOutput.meta?.engineVersion,
    fallbackReason: normalizedOutput.meta?.fallbackReason,
    output: normalizedOutput,
  };
}

export function readStoredAnalysisRecord(
  analysisJson: Json | null,
  persistedAt?: string | null,
): AnalysisOutput | null {
  if (!analysisJson) {
    return null;
  }

  if (isStoredAnalysisRecord(analysisJson)) {
    return withPersistedMeta(
      analysisJson.output,
      analysisJson.updatedAt || persistedAt || analysisJson.generatedAt,
      analysisJson.provider,
      analysisJson.engineVersion,
      analysisJson.fallbackReason,
    );
  }

  if (isAnalysisOutputLike(analysisJson)) {
    const provider = analysisJson.meta?.provider;
    return withPersistedMeta(
      analysisJson,
      persistedAt || analysisJson.meta?.generatedAt || new Date().toISOString(),
      provider,
      analysisJson.meta?.engineVersion,
      analysisJson.meta?.fallbackReason,
    );
  }

  return null;
}
