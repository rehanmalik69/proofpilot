import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { NoticeTone } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type NoticeProps = {
  tone: NoticeTone;
  message: string;
  className?: string;
};

const toneStyles: Record<NoticeTone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const;

export function Notice({ tone, message, className }: NoticeProps) {
  const Icon = toneIcons[tone];

  return (
    <div className={cn("flex items-start gap-3 rounded-[1.5rem] border px-4 py-4 text-sm", toneStyles[tone], className)}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <p className="leading-7">{message}</p>
    </div>
  );
}
