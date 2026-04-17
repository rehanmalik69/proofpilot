"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";

function redirectBack(pathname: string, tone: "error" | "success", message: string): never {
  redirect(withFlash(pathname, tone, message));
}

function isMissingObjectError(message?: string | null) {
  const value = message?.toLowerCase() ?? "";
  return value.includes("not found") || value.includes("no such object") || value.includes("does not exist");
}

export async function deleteEvidenceAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  if (!supabase || !user) {
    redirect("/auth/login");
  }

  const caseId = String(formData.get("caseId") ?? "").trim();
  const fileId = String(formData.get("fileId") ?? "").trim();

  if (!caseId || !fileId) {
    redirectBack("/dashboard", "error", "The selected evidence file could not be identified.");
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("evidence_files")
    .select("id, case_id, user_id, file_name, file_path, storage_bucket")
    .eq("id", fileId)
    .eq("case_id", caseId)
    .eq("user_id", user.id)
    .single();

  if (fileError || !fileRow) {
    redirectBack(`/cases/${caseId}`, "error", "That evidence file was not found.");
  }

  const { error: storageError } = await supabase.storage
    .from(fileRow.storage_bucket)
    .remove([fileRow.file_path]);

  if (storageError && !isMissingObjectError(storageError.message)) {
    redirectBack(
      `/cases/${caseId}`,
      "error",
      storageError.message || "The evidence file could not be removed from storage.",
    );
  }

  const { error: deleteError } = await supabase
    .from("evidence_files")
    .delete()
    .eq("id", fileRow.id)
    .eq("case_id", caseId)
    .eq("user_id", user.id);

  if (deleteError) {
    redirectBack(
      `/cases/${caseId}`,
      "error",
      deleteError.message || "The evidence record could not be deleted.",
    );
  }

  revalidatePath(`/cases/${caseId}`);
  redirectBack(`/cases/${caseId}`, "success", `Removed ${fileRow.file_name}.`);
}
