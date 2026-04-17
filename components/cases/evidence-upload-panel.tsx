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
      <CardHeader>
        <CardDescription>Evidence workflow</CardDescription>
        <CardTitle className="text-[1.7rem]">Upload supporting files</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={`/api/cases/${caseId}/evidence`}
          className="space-y-5"
          encType="multipart/form-data"
          method="post"
          onSubmit={() => setIsSubmitting(true)}
        >
          <label
            htmlFor="file"
            className="group flex cursor-pointer flex-col gap-4 rounded-[1.65rem] border border-dashed border-slate-300 bg-white px-5 py-6 text-sm transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,23,42,0.04))] text-blue-700">
                <UploadCloud className="size-5" />
              </div>
              <div className="space-y-2">
                <div className="text-base font-semibold text-slate-950">
                  Drop in a receipt, screenshot, PDF, or text record
                </div>
                <div className="leading-7 text-slate-600">
                  Files are stored securely in Supabase Storage and linked directly to this case
                  workspace.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {EVIDENCE_TYPE_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-slate-600"
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
              className="text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/70 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-blue-700" />
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-950">Upload rules</p>
                <p>Supported types: images, PDF, and text-based files.</p>
                <p>Maximum file size: {formatFileSize(EVIDENCE_MAX_FILE_SIZE)}.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-h-12 flex-1 rounded-[1.35rem] border border-slate-200/70 bg-white/95 px-4 py-3">
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
