import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  EVIDENCE_BUCKET,
  EVIDENCE_MAX_FILE_SIZE,
  isSupportedEvidenceFile,
  resolveEvidenceMimeType,
} from "@/lib/constants/evidence";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withFlash } from "@/lib/flash";
import { safeFileName } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function redirectWithMessage(
  request: Request,
  pathname: string,
  tone: "error" | "success",
  message: string,
) {
  return NextResponse.redirect(new URL(withFlash(pathname, tone, message), request.url), {
    status: 303,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return redirectWithMessage(
      request,
      `/cases/${id}`,
      "error",
      "Supabase environment variables are not configured.",
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage(request, "/auth/login", "error", "Please sign in to upload evidence.");
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return redirectWithMessage(request, `/cases/${id}`, "error", "Choose a file before uploading.");
  }

  if (file.size > EVIDENCE_MAX_FILE_SIZE) {
    return redirectWithMessage(
      request,
      `/cases/${id}`,
      "error",
      "That file is too large. Upload images, PDF, or text files up to 15 MB.",
    );
  }

  if (!isSupportedEvidenceFile(file.name, file.type)) {
    return redirectWithMessage(
      request,
      `/cases/${id}`,
      "error",
      "Unsupported file type. Upload images, PDF, or text-based files only.",
    );
  }

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (caseError || !caseItem) {
    return redirectWithMessage(request, "/dashboard", "error", "That case was not found.");
  }

  const filePath = `${user.id}/${id}/${Date.now()}-${safeFileName(file.name)}`;
  const fileBuffer = await file.arrayBuffer();
  const normalizedMimeType = resolveEvidenceMimeType(file.name, file.type);

  const { error: uploadError } = await supabase.storage.from(EVIDENCE_BUCKET).upload(filePath, fileBuffer, {
    contentType: normalizedMimeType || file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return redirectWithMessage(
      request,
      `/cases/${id}`,
      "error",
      uploadError.message || "The evidence file could not be uploaded.",
    );
  }

  const { error: insertError } = await supabase.from("evidence_files").insert({
    case_id: id,
    user_id: user.id,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    mime_type: normalizedMimeType,
    storage_bucket: EVIDENCE_BUCKET,
  });

  if (insertError) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([filePath]);

    return redirectWithMessage(
      request,
      `/cases/${id}`,
      "error",
      insertError.message || "The evidence record could not be created.",
    );
  }

  revalidatePath(`/cases/${id}`);

  return redirectWithMessage(request, `/cases/${id}`, "success", `Uploaded ${file.name}.`);
}
