"use client";

import { LoaderCircle, ShieldCheck, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EVIDENCE_ACCEPT_ATTRIBUTE,
  EVIDENCE_MAX_FILE_SIZE,
  EVIDENCE_TYPE_CHIPS,
  getEvidenceTypeLabel,
} from "@/lib/constants/evidence";
import { cn, formatFileSize } from "@/lib/utils";

type EvidenceUploadPanelProps = {
  caseId: string;
  className?: string;
};

export function EvidenceUploadPanel({ caseId, className }: EvidenceUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className={cn("surface border-white/80 shadow-[0_22px_48px_rgba(15,23,42,0.05)]", className)}>
      <CardHeader className="p-5 pb-0 sm:p-7 sm:pb-0">
        <CardDescription>Evidence workflow</CardDescription>
        <CardTitle className="text-[1.45rem] sm:text-[1.7rem]">Upload supporting files</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={`/api/cases/${caseId}/evidence`}
          className="space-y-4 sm:space-y-5"
          encType="multipart/form-data"
          method="post"
          onSubmit={() => setIsSubmitting(true)}
        >
          <label
            htmlFor="file"
            className="group flex cursor-pointer flex-col gap-3 rounded-[1.45rem] border border-dashed border-slate-300 bg-white px-4 py-5 text-[13px] transition hover:border-blue-300 hover:bg-blue-50/40 sm:gap-4 sm:rounded-[1.65rem] sm:px-5 sm:py-6 sm:text-sm"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-10 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,23,42,0.04))] text-blue-700 sm:size-12 sm:rounded-2xl">
                <UploadCloud className="size-4 sm:size-5" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="text-[15px] font-semibold leading-6 text-slate-950 sm:text-base">
                  Drop in a receipt, screenshot, PDF, or text record
                </div>
                <div className="leading-6 text-slate-600 sm:leading-7">
                  Files are stored securely in Supabase Storage and linked directly to this case
                  workspace.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {EVIDENCE_TYPE_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-slate-600 sm:px-3 sm:text-xs sm:tracking-[0.04em]"
                >
                  {chip}
                </span>
              ))}
            </div>

            <input
              id="file"
              name="file"
              type="file"
              accept={EVIDENCE_ACCEPT_ATTRIBUTE}
              className="text-[13px] text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-3.5 file:py-1.5 file:text-[13px] file:font-semibold file:text-white sm:text-sm sm:file:mr-4 sm:file:px-4 sm:file:py-2 sm:file:text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/70 p-3.5 sm:rounded-[1.45rem] sm:p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-blue-700" />
              <div className="space-y-1 text-[13px] text-slate-600 sm:text-sm">
                <p className="font-semibold text-slate-950">Upload rules</p>
                <p>Supported types: images, PDF, and text-based files.</p>
                <p>Maximum file size: {formatFileSize(EVIDENCE_MAX_FILE_SIZE)}.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-h-11 flex-1 rounded-[1.2rem] border border-slate-200/70 bg-white/95 px-3.5 py-2.5 sm:min-h-12 sm:rounded-[1.35rem] sm:px-4 sm:py-3">
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-950">{file.name}</p>
                  <p className="text-xs text-slate-500">{`${getEvidenceTypeLabel(file.type || null)} / ${formatFileSize(file.size)}`}</p>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No file selected yet.</div>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !file}
              className="w-full min-w-44 sm:w-auto xl:min-w-[11rem]"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              {isSubmitting ? "Uploading..." : "Upload evidence"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
