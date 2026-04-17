import { createLocalAnalysis } from "@/lib/local-analysis-engine";
import type { AnalysisOutput, CaseRecord, EvidenceFileRecord } from "@/lib/types/domain";

export function createMockAnalysis(
  caseItem: CaseRecord,
  evidenceFiles: EvidenceFileRecord[],
): AnalysisOutput {
  return createLocalAnalysis(caseItem, evidenceFiles);
}
