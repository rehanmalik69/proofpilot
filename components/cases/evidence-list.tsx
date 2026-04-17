import { Download, FileImage, FileText, UploadCloud } from "lucide-react";
import { deleteEvidenceAction } from "@/lib/actions/evidence";
import { getEvidenceTypeLabel } from "@/lib/constants/evidence";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { EvidenceListItem } from "@/lib/types/domain";
import { formatDate, formatFileSize } from "@/lib/utils";

type EvidenceListProps = {
  files: EvidenceListItem[];
};

export function EvidenceList({ files }: EvidenceListProps) {
  return (
    <Card className="surface border-white/80">
      <CardHeader>
        <CardDescription>Evidence files</CardDescription>
        <CardTitle className="text-[1.7rem]">Uploaded support</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length > 0 ? (
          files.map((file) => (
            <div
              key={file.id}
              className="rounded-[1.55rem] border border-slate-200/80 bg-slate-50/85 p-5 transition duration-200 hover:border-slate-300 hover:bg-white sm:p-6"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
                      {file.mime_type?.startsWith("image/") ? (
                        <FileImage className="size-5" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-base font-semibold leading-6 text-slate-950">
                        {file.file_name}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <Badge variant="ghost">{getEvidenceTypeLabel(file.mime_type)}</Badge>
                        <Badge variant="ghost">{formatFileSize(file.file_size)}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:justify-end">
                    {file.downloadUrl ? (
                      <a
                        href={file.downloadUrl}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="size-4" />
                        View
                      </a>
                    ) : null}
                    <form action={deleteEvidenceAction}>
                      <input type="hidden" name="caseId" value={file.case_id} />
                      <input type="hidden" name="fileId" value={file.id} />
                      <SubmitButton
                        label="Delete"
                        pendingLabel="Deleting..."
                        iconName="trash"
                        size="sm"
                        variant="destructive"
                        className="min-w-[7.75rem]"
                      />
                    </form>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-white/90 bg-white/90 px-4 py-3.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      File Type
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-950">
                      {getEvidenceTypeLabel(file.mime_type)}
                    </div>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/90 bg-white/90 px-4 py-3.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      File Size
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-950">
                      {formatFileSize(file.file_size)}
                    </div>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/90 bg-white/90 px-4 py-3.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Uploaded
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-950">
                      {formatDate(file.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.88))] px-6 py-10 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
              <UploadCloud className="size-6" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-950">No evidence uploaded yet</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Start this workspace with receipts, screenshots, PDFs, or support transcripts so
              ProofPilot can build a stronger dispute record.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
