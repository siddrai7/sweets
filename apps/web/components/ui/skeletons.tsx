/** Placeholder shapes shown while a page streams in. */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[1.25rem] border border-brand-200 bg-white p-2.5"
        >
          <div className="aspect-square rounded-[0.9rem] bg-brand-100" />
          <div className="mt-3 h-3 w-2/3 rounded bg-brand-100" />
          <div className="mt-2 h-3 w-1/3 rounded bg-brand-100" />
          <div className="mt-4 h-9 rounded-xl bg-brand-100" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="container-page py-8" role="status" aria-label="Loading">
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-brand-100" />
      <div className="mb-8 h-12 w-2/3 max-w-md animate-pulse rounded-xl bg-brand-100" />
      {children ?? <GridSkeleton />}
    </div>
  );
}
