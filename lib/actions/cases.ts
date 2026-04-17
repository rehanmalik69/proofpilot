"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  CASE_STATUS_OPTIONS,
  getCaseStatusLabel,
  normalizeCaseStatus,
} from "@/lib/constants/case-status";
import { extractEvidenceTexts } from "@/lib/evidence-text";
import { withFlash } from "@/lib/flash";
import { generateLocalCaseAnalysis } from "@/lib/local-analysis-engine";
import type { CaseStatus } from "@/lib/constants/case-status";
import type { EvidenceFileRecord, ExtractedEvidenceText } from "@/lib/types/domain";
import { safeFileName } from "@/lib/utils";

function redirectBack(pathname: string, tone: "error" | "success", message: string): never {
  redirect(withFlash(pathname, tone, message));
}

function isMissingStatusColumnError(message?: string | null) {
  return Boolean(message?.toLowerCase().includes("status"));
}

const DEMO_CASE_STATUS: CaseStatus = "ready_to_submit";
const DEMO_CASE_INPUT = {
  title: "Refund stalled after damaged espresso machine delivery",
  disputeType: "Refund Denial",
  merchantName: "Northline Home",
  issueDescription:
    "The customer received a damaged espresso machine, reported the defect promptly, and was later told a refund would be processed. The refund has still not been completed despite follow-up communication and supporting records.",
  transactionAmount: 184,
  incidentDate: "2026-03-02",
};
const DEMO_EVIDENCE_FILE_NAME = "proofpilot-demo-case-record.txt";
const DEMO_EVIDENCE_TEXT = `Order Confirmation
Merchant: Northline Home
Order Number: NH-48271
Order Date: March 2, 2026
Item: Espresso machine
Amount Paid: $184.00

Support Email Thread
March 4, 2026:
Northline Home support confirmed that the product arrived damaged and advised that a refund would be processed after review.

March 8, 2026:
The customer followed up and requested confirmation of the refund timeline because no credit had been received.

March 12, 2026:
The customer asked for an updated response after the refund remained outstanding.

March 15, 2026:
The merchant acknowledged the follow-up but did not provide a completed refund or a final written resolution.
`;

export async function createCaseAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  if (!supabase || !user) {
    redirect("/auth/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const disputeType = String(formData.get("disputeType") ?? "").trim();
  const merchantName = String(formData.get("merchantName") ?? "").trim();
  const issueDescription = String(formData.get("issueDescription") ?? "").trim();
  const transactionAmountValue = String(formData.get("transactionAmount") ?? "").trim();
  const incidentDate = String(formData.get("incidentDate") ?? "").trim();
  const requestedStatus = String(formData.get("status") ?? "draft").trim();
  const status = normalizeCaseStatus(requestedStatus);

  if (!title || !disputeType || !merchantName || !issueDescription) {
    redirectBack("/cases/new", "error", "Please complete all required fields.");
  }

  if (title.length < 4) {
    redirectBack("/cases/new", "error", "Use a clearer title with at least 4 characters.");
  }

  if (merchantName.length < 2) {
    redirectBack("/cases/new", "error", "Merchant name should be at least 2 characters.");
  }

  if (issueDescription.length < 20) {
    redirectBack(
      "/cases/new",
      "error",
      "Issue description should be at least 20 characters so the case has enough context.",
    );
  }

  if (!CASE_STATUS_OPTIONS.some((item) => item.value === requestedStatus)) {
    redirectBack("/cases/new", "error", "Choose a valid case status.");
  }

  const transactionAmount = transactionAmountValue ? Number(transactionAmountValue) : null;

  if (transactionAmountValue && Number.isNaN(transactionAmount)) {
    redirectBack("/cases/new", "error", "Transaction amount must be a valid number.");
  }

  if (transactionAmount !== null && transactionAmount < 0) {
    redirectBack("/cases/new", "error", "Transaction amount cannot be negative.");
  }

  const insertPayload = {
    user_id: user.id,
    title,
    dispute_type: disputeType,
    merchant_name: merchantName,
    issue_description: issueDescription,
    transaction_amount: transactionAmount,
    incident_date: incidentDate || null,
    status,
  };

  let { data, error } = await supabase
    .from("cases")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error && isMissingStatusColumnError(error.message)) {
    const fallback = await supabase
      .from("cases")
      .insert({
        user_id: user.id,
        title,
        dispute_type: disputeType,
        merchant_name: merchantName,
        issue_description: issueDescription,
        transaction_amount: transactionAmount,
        incident_date: incidentDate || null,
      })
      .select("id")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    redirectBack(
      "/cases/new",
      "error",
      error?.message || "ProofPilot could not create the case right now. Please try again.",
    );
  }

  revalidatePath("/dashboard");
  redirectBack(
    `/cases/${data.id}`,
    "success",
    `Case created successfully with status ${getCaseStatusLabel(status).toLowerCase()}.`,
  );
}

export async function runAnalysisAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  if (!supabase || !user) {
    redirect("/auth/login");
  }

  const caseId = String(formData.get("caseId") ?? "").trim();

  if (!caseId) {
    redirectBack("/dashboard", "error", "A case id is required to run analysis.");
  }

  const [{ data: caseItem, error: caseError }, { data: evidenceFiles, error: filesError }] = await Promise.all([
    supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .single(),
    supabase.from("evidence_files").select("*").eq("case_id", caseId).eq("user_id", user.id),
  ]);

  if (caseError || !caseItem) {
    redirectBack("/dashboard", "error", "The case was not found.");
  }

  if (filesError) {
    redirectBack(`/cases/${caseId}`, "error", filesError.message || "Evidence files could not be loaded.");
  }

  let extractedEvidenceTexts: ExtractedEvidenceText[] = [];

  try {
    extractedEvidenceTexts = await extractEvidenceTexts(supabase, evidenceFiles ?? []);
  } catch (extractionError) {
    console.error("Evidence text extraction fell back to metadata-only analysis.", {
      caseId,
      extractionError,
    });
  }

  const { analysis, message } = await generateLocalCaseAnalysis({
    caseItem,
    evidenceFiles: evidenceFiles ?? [],
    extractedEvidenceTexts,
  });

  const { error } = await supabase.from("analyses").upsert(
    {
      case_id: caseId,
      user_id: user.id,
      analysis_json: analysis,
    },
    { onConflict: "case_id" },
  );

  if (error) {
    redirectBack(`/cases/${caseId}`, "error", error.message || "Analysis could not be saved.");
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/dashboard");
  redirectBack(`/cases/${caseId}`, "success", message);
}

export async function updateCaseStatusAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  if (!supabase || !user) {
    redirect("/auth/login");
  }

  const caseId = String(formData.get("caseId") ?? "").trim();
  const requestedStatus = String(formData.get("status") ?? "").trim();

  if (!caseId) {
    redirectBack("/dashboard", "error", "A case id is required to update the status.");
  }

  if (!CASE_STATUS_OPTIONS.some((item) => item.value === requestedStatus)) {
    redirectBack(`/cases/${caseId}`, "error", "Choose a valid case status.");
  }

  const status = normalizeCaseStatus(requestedStatus);
  const { data, error } = await supabase
    .from("cases")
    .update({ status })
    .eq("id", caseId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error && isMissingStatusColumnError(error.message)) {
    redirectBack(
      `/cases/${caseId}`,
      "error",
      "Case statuses are not fully configured yet. Run the case status migration and try again.",
    );
  }

  if (error || !data) {
    redirectBack(
      `/cases/${caseId}`,
      "error",
      error?.message || "ProofPilot could not update the case status right now.",
    );
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/dashboard");
  redirectBack(
    `/cases/${caseId}`,
    "success",
    `Case status updated to ${getCaseStatusLabel(status).toLowerCase()}.`,
  );
}

export async function createDemoCaseAction() {
  const { supabase, user } = await requireUser();

  if (!supabase || !user) {
    redirect("/auth/login");
  }

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      title: DEMO_CASE_INPUT.title,
      dispute_type: DEMO_CASE_INPUT.disputeType,
      merchant_name: DEMO_CASE_INPUT.merchantName,
      issue_description: DEMO_CASE_INPUT.issueDescription,
      transaction_amount: DEMO_CASE_INPUT.transactionAmount,
      incident_date: DEMO_CASE_INPUT.incidentDate,
      status: DEMO_CASE_STATUS,
    })
    .select("*")
    .single();

  if (caseError || !caseItem) {
    redirectBack(
      "/dashboard",
      "error",
      caseError?.message || "The demo case could not be created right now.",
    );
  }

  let evidenceFiles: EvidenceFileRecord[] = [];
  let extractedEvidenceTexts: ExtractedEvidenceText[] = [];

  try {
    const filePath = `${user.id}/${caseItem.id}/${Date.now()}-${safeFileName(DEMO_EVIDENCE_FILE_NAME)}`;
    const upload = await supabase.storage.from("evidence-files").upload(
      filePath,
      new Blob([DEMO_EVIDENCE_TEXT], { type: "text/plain;charset=utf-8" }),
      {
        contentType: "text/plain;charset=utf-8",
        upsert: false,
      },
    );

    if (!upload.error) {
      const evidenceInsert = await supabase
        .from("evidence_files")
        .insert({
          case_id: caseItem.id,
          user_id: user.id,
          file_name: DEMO_EVIDENCE_FILE_NAME,
          file_path: filePath,
          file_size: new TextEncoder().encode(DEMO_EVIDENCE_TEXT).byteLength,
          mime_type: "text/plain",
          storage_bucket: "evidence-files",
        })
        .select("*")
        .single();

      if (!evidenceInsert.error && evidenceInsert.data) {
        evidenceFiles = [evidenceInsert.data];
        extractedEvidenceTexts = [
          {
            fileId: evidenceInsert.data.id,
            fileName: evidenceInsert.data.file_name,
            fileType: "txt",
            text: DEMO_EVIDENCE_TEXT,
            charCount: DEMO_EVIDENCE_TEXT.length,
          },
        ];
      }
    }
  } catch (demoEvidenceError) {
    console.error("Demo evidence setup failed. Continuing with the demo case only.", {
      caseId: caseItem.id,
      demoEvidenceError,
    });
  }

  const { analysis } = await generateLocalCaseAnalysis({
    caseItem,
    evidenceFiles,
    extractedEvidenceTexts,
  });

  const { error: analysisError } = await supabase.from("analyses").upsert(
    {
      case_id: caseItem.id,
      user_id: user.id,
      analysis_json: analysis,
    },
    { onConflict: "case_id" },
  );

  revalidatePath(`/cases/${caseItem.id}`);
  revalidatePath("/dashboard");

  if (analysisError) {
    redirectBack(
      `/cases/${caseItem.id}`,
      "error",
      "Demo case created, but the structured analysis could not be saved.",
    );
  }

  redirectBack(
    `/cases/${caseItem.id}`,
    "success",
    "Demo case created with a bundled evidence record and a ready-to-present analysis.",
  );
}
