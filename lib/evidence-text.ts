import "server-only";

import pdf from "@cedrugs/pdf-parse";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { EvidenceFileRecord, ExtractedEvidenceText } from "@/lib/types/domain";

const MAX_EXTRACTABLE_FILES = 6;
const MAX_TEXT_CHARACTERS = 12000;

function isTxtEvidenceFile(file: EvidenceFileRecord) {
  return (
    file.file_name.toLowerCase().endsWith(".txt") ||
    file.mime_type?.toLowerCase().startsWith("text/plain") === true
  );
}

function isPdfEvidenceFile(file: EvidenceFileRecord) {
  return (
    file.file_name.toLowerCase().endsWith(".pdf") ||
    file.mime_type?.toLowerCase().includes("pdf") === true
  );
}

function normalizeExtractedText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARACTERS);
}

async function extractTxtText(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  return normalizeExtractedText(new TextDecoder("utf-8").decode(buffer));
}

async function extractPdfText(blob: Blob) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const parsed = await pdf(buffer);
  return normalizeExtractedText(parsed.text ?? "");
}

async function extractSingleEvidenceText(
  supabase: SupabaseClient<Database>,
  file: EvidenceFileRecord,
): Promise<ExtractedEvidenceText | null> {
  if (!isTxtEvidenceFile(file) && !isPdfEvidenceFile(file)) {
    return null;
  }

  const { data, error } = await supabase.storage.from(file.storage_bucket).download(file.file_path);

  if (error || !data) {
    return null;
  }

  try {
    const text = isTxtEvidenceFile(file) ? await extractTxtText(data) : await extractPdfText(data);

    if (!text) {
      return null;
    }

    return {
      fileId: file.id,
      fileName: file.file_name,
      fileType: isTxtEvidenceFile(file) ? "txt" : "pdf",
      text,
      charCount: text.length,
    };
  } catch (extractionError) {
    console.error("Evidence text extraction failed.", {
      fileId: file.id,
      fileName: file.file_name,
      extractionError,
    });
    return null;
  }
}

export async function extractEvidenceTexts(
  supabase: SupabaseClient<Database>,
  evidenceFiles: EvidenceFileRecord[],
) {
  const extractableFiles = evidenceFiles
    .filter((file) => isTxtEvidenceFile(file) || isPdfEvidenceFile(file))
    .slice(0, MAX_EXTRACTABLE_FILES);

  const extractedFiles = await Promise.all(
    extractableFiles.map((file) => extractSingleEvidenceText(supabase, file)),
  );

  return extractedFiles.filter((file): file is ExtractedEvidenceText => Boolean(file));
}
