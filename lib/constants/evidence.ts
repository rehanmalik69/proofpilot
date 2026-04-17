export const EVIDENCE_BUCKET = "evidence-files";
export const EVIDENCE_MAX_FILE_SIZE = 15 * 1024 * 1024;
export const EVIDENCE_ACCEPT_ATTRIBUTE =
  "image/*,.pdf,text/plain,.txt,text/markdown,.md,text/csv,.csv,application/json,.json,.log";

export const EVIDENCE_TYPE_CHIPS = ["Images", "PDF", "Text"] as const;

const EXACT_MIME_TYPES = new Set([
  "application/json",
  "application/pdf",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

const EXTENSION_MIME_MAP: Record<string, string> = {
  csv: "text/csv",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  json: "application/json",
  log: "text/plain",
  md: "text/markdown",
  pdf: "application/pdf",
  png: "image/png",
  txt: "text/plain",
  webp: "image/webp",
};

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

export function resolveEvidenceMimeType(fileName: string, mimeType?: string | null) {
  const normalizedType = mimeType?.trim().toLowerCase();

  if (normalizedType) {
    if (normalizedType.startsWith("image/")) {
      return normalizedType;
    }

    if (EXACT_MIME_TYPES.has(normalizedType)) {
      return normalizedType;
    }
  }

  const extension = getExtension(fileName);
  return extension ? EXTENSION_MIME_MAP[extension] ?? null : null;
}

export function isSupportedEvidenceFile(fileName: string, mimeType?: string | null) {
  return Boolean(resolveEvidenceMimeType(fileName, mimeType));
}

export function getEvidenceTypeLabel(mimeType?: string | null) {
  if (!mimeType) {
    return "Unknown";
  }

  if (mimeType.startsWith("image/")) {
    return "Image";
  }

  switch (mimeType) {
    case "application/pdf":
      return "PDF";
    case "application/json":
      return "JSON";
    case "text/csv":
      return "CSV";
    case "text/markdown":
      return "Markdown";
    case "text/plain":
      return "Text";
    default:
      return mimeType;
  }
}
