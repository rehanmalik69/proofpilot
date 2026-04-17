export const CASE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "ready_to_submit", label: "Ready to Submit" },
  { value: "submitted", label: "Submitted" },
  { value: "resolved", label: "Resolved" },
] as const;

export type CaseStatus = (typeof CASE_STATUS_OPTIONS)[number]["value"];

const STATUS_SET = new Set<string>(CASE_STATUS_OPTIONS.map((item) => item.value));
const LEGACY_STATUS_MAP: Record<string, CaseStatus> = {
  pending: "draft",
  closed: "resolved",
};

export function normalizeCaseStatus(status?: string | null): CaseStatus {
  if (status && STATUS_SET.has(status)) {
    return status as CaseStatus;
  }

  if (status && LEGACY_STATUS_MAP[status]) {
    return LEGACY_STATUS_MAP[status];
  }

  return "draft";
}

export function getCaseStatusLabel(status?: string | null) {
  const normalized = normalizeCaseStatus(status);
  return CASE_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ?? "Draft";
}

export function getCaseStatusVariant(
  status?: string | null,
): "warning" | "info" | "success" | "ghost" {
  const normalized = normalizeCaseStatus(status);

  switch (normalized) {
    case "draft":
      return "ghost";
    case "under_review":
      return "info";
    case "ready_to_submit":
      return "warning";
    case "submitted":
      return "info";
    case "resolved":
      return "success";
    default:
      return "ghost";
  }
}
