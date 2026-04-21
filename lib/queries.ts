import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readStoredAnalysisRecord } from "@/lib/analysis-storage";
import { normalizeCaseStatus } from "@/lib/constants/case-status";
import type {
  AnalysisOutput,
  CaseRecord,
  CaseRecordWithStatus,
  DashboardActivity,
  DashboardCase,
  EvidenceListItem,
} from "@/lib/types/domain";

function isMissingStatusColumnError(message?: string | null) {
  return Boolean(message?.toLowerCase().includes("status"));
}

function normalizeCaseRecord<T extends { status?: string | null }>(caseItem: T) {
  return {
    ...caseItem,
    status: normalizeCaseStatus(caseItem.status),
  };
}

export async function getDashboardCases(userId: string): Promise<DashboardCase[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data: casesWithStatus, error } = await supabase
    .from("cases")
    .select("id, title, dispute_type, merchant_name, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  let cases = casesWithStatus;

  if (error && isMissingStatusColumnError(error.message)) {
    const fallback = await supabase
      .from("cases")
      .select("id, title, dispute_type, merchant_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fallback.error || !fallback.data) {
      return [];
    }

    cases = fallback.data.map((caseItem) => ({
      ...caseItem,
      status: "draft",
    }));
  }

  if (error && !isMissingStatusColumnError(error.message)) {
    return [];
  }

  if (!cases) {
    return [];
  }

  const caseIds = cases.map((caseItem) => caseItem.id);
  const analysisCounts = new Map<string, number>();

  if (caseIds.length > 0) {
    const { data: analyses } = await supabase
      .from("analyses")
      .select("case_id")
      .in("case_id", caseIds)
      .eq("user_id", userId);

    for (const analysis of analyses ?? []) {
      analysisCounts.set(analysis.case_id, (analysisCounts.get(analysis.case_id) ?? 0) + 1);
    }
  }

  return cases.map((caseItem) => ({
    ...normalizeCaseRecord(caseItem),
    analysisCount: analysisCounts.get(caseItem.id) ?? 0,
  }));
}

export async function getDashboardOverview(userId: string): Promise<{
  cases: DashboardCase[];
  recentActivity: DashboardActivity[];
}> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { cases: [], recentActivity: [] };
  }

  const cases = await getDashboardCases(userId);
  const caseLookup = new Map(cases.map((caseItem) => [caseItem.id, caseItem]));
  const caseIds = cases.map((caseItem) => caseItem.id);

  if (caseIds.length === 0) {
    return { cases, recentActivity: [] };
  }

  const [{ data: recentEvidence }, { data: recentAnalyses }] = await Promise.all([
    supabase
      .from("evidence_files")
      .select("id, case_id, file_name, created_at")
      .eq("user_id", userId)
      .in("case_id", caseIds)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("analyses")
      .select("id, case_id, updated_at")
      .eq("user_id", userId)
      .in("case_id", caseIds)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const recentActivity = [
    ...cases.slice(0, 4).map<DashboardActivity>((caseItem) => ({
      id: `case-${caseItem.id}`,
      caseId: caseItem.id,
      title: "Case opened",
      description: `${caseItem.title} was added to the workspace for ${caseItem.merchant_name}.`,
      createdAt: caseItem.created_at,
      kind: "case",
    })),
    ...(recentEvidence ?? []).flatMap<DashboardActivity>((item) => {
      const caseItem = caseLookup.get(item.case_id);

      if (!caseItem) {
        return [];
      }

      return [
        {
          id: `evidence-${item.id}`,
          caseId: item.case_id,
          title: "Evidence uploaded",
          description: `${item.file_name} was added to ${caseItem.title}.`,
          createdAt: item.created_at,
          kind: "evidence",
        },
      ];
    }),
    ...(recentAnalyses ?? []).flatMap<DashboardActivity>((item) => {
      const caseItem = caseLookup.get(item.case_id);

      if (!caseItem) {
        return [];
      }

      return [
        {
          id: `analysis-${item.id}`,
          caseId: item.case_id,
          title: "Analysis refreshed",
          description: `${caseItem.title} now has an updated structured complaint report.`,
          createdAt: item.updated_at,
          kind: "analysis",
        },
      ];
    }),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return { cases, recentActivity };
}

export async function getCaseDetail(userId: string, caseId: string): Promise<{
  caseItem: CaseRecordWithStatus;
  evidenceFiles: EvidenceListItem[];
  analysis: AnalysisOutput | null;
} | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("user_id", userId)
    .single();

  if (caseError || !caseItem) {
    return null;
  }

  const [{ data: evidenceFiles }, { data: analysisRows }] = await Promise.all([
    supabase
      .from("evidence_files")
      .select("*")
      .eq("case_id", caseId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("analyses")
      .select("id, analysis_json, updated_at, created_at")
      .eq("case_id", caseId)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const latestAnalysisRow = analysisRows?.[0] ?? null;

  if ((analysisRows?.length ?? 0) > 1) {
    console.error("Multiple analysis rows found for a single case. ProofPilot is using the latest row.", {
      caseId,
      userId,
      analysisRowIds: analysisRows?.map((row) => row.id),
    });
  }

  const signedFiles = await Promise.all(
    (evidenceFiles ?? []).map(async (file) => {
      const { data } = await supabase.storage
        .from(file.storage_bucket)
        .createSignedUrl(file.file_path, 60 * 60);

      return {
        ...file,
        downloadUrl: data?.signedUrl ?? null,
      };
    }),
  );

  return {
    caseItem: normalizeCaseRecord(caseItem as CaseRecord),
    evidenceFiles: signedFiles,
    analysis: latestAnalysisRow
      ? (readStoredAnalysisRecord(
          latestAnalysisRow.analysis_json,
          latestAnalysisRow.updated_at,
        ) as AnalysisOutput | null)
      : null,
  };
}
