import { Activity, FileSearch, FileText, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardActivity } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";

type RecentActivityProps = {
  items: DashboardActivity[];
};

const activityIcons = {
  analysis: FileSearch,
  case: FileText,
  evidence: UploadCloud,
} as const;

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card className="surface border-white/80">
      <CardHeader>
        <CardDescription>Workspace pulse</CardDescription>
        <CardTitle className="text-[1.7rem]">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = activityIcons[item.kind];

              return (
                <Link
                  key={item.id}
                  href={`/cases/${item.caseId}`}
                  className="flex items-start gap-4 rounded-[1.45rem] border border-slate-200/80 bg-slate-50/85 p-4 transition duration-200 hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-950">{item.title}</div>
                      <div className="text-xs font-medium text-slate-500">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.7rem] border border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.88))] px-6 py-10 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
              <Activity className="size-6" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-950">No activity yet</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Create a case, upload evidence, or generate analysis to start building a visible
              activity feed for your complaint workspace.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
