export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 sm:px-8 lg:px-10">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="surface h-32 animate-pulse rounded-[1.75rem] border border-white/80"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="surface h-48 animate-pulse rounded-[1.75rem] border border-white/80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
