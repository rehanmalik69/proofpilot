import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type SetupRequiredProps = {
  compact?: boolean;
  className?: string;
};

export function SetupRequired({ compact = false, className }: SetupRequiredProps) {
  return (
    <div
      className={cn(
        "surface-strong rounded-[2.4rem] border border-white/80 p-6 sm:p-8",
        compact ? "max-w-2xl" : "",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="size-5" />
        </div>
        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Project wiring incomplete
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Supabase is not connected yet
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              The UI is running, but authentication, case storage, and evidence uploads stay disabled
              until the Supabase environment variables are present and the schema has been applied.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium">
                .env.local
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium">
                supabase/schema.sql
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium">
                restart dev server
              </span>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200/80 bg-slate-50/90 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Required env
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                NEXT_PUBLIC_SUPABASE_URL
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-950">What to do</div>
              <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                <li>1. Create `proofpilot/.env.local` and add the two Supabase values.</li>
                <li>2. Run the SQL in `supabase/schema.sql` inside your Supabase project.</li>
                <li>3. Restart `npm run dev` so the app picks the env vars up.</li>
              </ol>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              OpenAI is optional for the first boot. Supabase is not.
            </p>
          </div>
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              Once this is connected, the signup and dashboard flow will work normally
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
