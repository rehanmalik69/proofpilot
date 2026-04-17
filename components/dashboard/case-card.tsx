import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, FileStack } from "lucide-react";
import {
  getCaseStatusLabel,
  getCaseStatusVariant,
} from "@/lib/constants/case-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardCase } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";

type CaseCardProps = {
  caseItem: DashboardCase;
};

export function CaseCard({ caseItem }: CaseCardProps) {
  return (
    <Link href={`/cases/${caseItem.id}`} className="group block">
      <Card className="surface h-full border-white/80 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-slate-200 group-hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
        <CardHeader className="gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{caseItem.dispute_type}</Badge>
                <Badge variant={getCaseStatusVariant(caseItem.status)}>
                  {getCaseStatusLabel(caseItem.status)}
                </Badge>
              </div>
              <CardTitle className="text-[1.65rem] leading-tight tracking-[-0.03em]">
                {caseItem.title}
              </CardTitle>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-400 transition group-hover:border-slate-300 group-hover:text-slate-950">
              <ArrowUpRight className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3.5 border-t border-slate-200/70 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4">
            <Building2 className="size-4 text-slate-950" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Merchant</div>
              <div className="text-sm font-semibold text-slate-950">{caseItem.merchant_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4">
            <FileStack className="size-4 text-slate-950" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Status</div>
              <div className="text-sm font-semibold text-slate-950">{getCaseStatusLabel(caseItem.status)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4">
            <CalendarDays className="size-4 text-slate-950" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Created</div>
              <div className="text-sm font-semibold text-slate-950">{formatDate(caseItem.created_at)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4">
            <Building2 className="size-4 text-slate-950" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Record</div>
              <div className="text-sm font-semibold text-slate-950">
                {caseItem.analysisCount > 0 ? "Analysis attached" : "Case created"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
