export default function CaseLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 sm:px-8 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="surface h-56 animate-pulse rounded-[2rem] border border-white/80" />
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="surface h-72 animate-pulse rounded-[1.75rem] border border-white/80"
              />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="surface h-56 animate-pulse rounded-[2rem] border border-white/80" />
          <div className="surface h-80 animate-pulse rounded-[2rem] border border-white/80" />
        </div>
      </div>
    </div>
  );
}
