import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { NoticeTone } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type NoticeProps = {
  tone: NoticeTone;
  message: string;
  detail?: string;
  className?: string;
};

const toneStyles: Record<NoticeTone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
} as const;

export function Notice({ tone, message, detail, className }: NoticeProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[1.5rem] border px-4 py-4 text-sm",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="leading-6">{message}</p>
        {detail ? <p className="text-[13px] leading-6 opacity-85">{detail}</p> : null}
      </div>
    </div>
  );
}
