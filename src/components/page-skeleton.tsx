export function PageSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-stone-200" />
        <div className="h-4 w-72 rounded bg-stone-100" />
      </div>
      {/* Content blocks */}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-stone-100 bg-white p-6 space-y-3">
          <div className="h-5 w-32 rounded bg-stone-200" />
          <div className="h-4 w-full rounded bg-stone-100" />
          <div className="h-4 w-4/5 rounded bg-stone-100" />
        </div>
      ))}
    </div>
  )
}
