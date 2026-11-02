export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <span className="sr-only">Loading…</span>
      <div className="space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card space-y-3 p-4">
            <div className="skeleton aspect-[4/3] w-full rounded-xl" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
