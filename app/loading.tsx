export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-6 py-16 sm:px-8 lg:px-10">
      <div className="surface flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] border border-white/80 px-8 py-14 text-center">
        <div className="size-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-slate-950">Preparing ProofPilot</p>
          <p className="text-sm text-slate-600">
            Loading your case workspace and evidence tools.
          </p>
        </div>
      </div>
    </div>
  );
}
