export default function Loading() {
  return (
    <div
      className="container-page grid gap-8 py-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
      role="status"
      aria-label="Loading"
    >
      <div className="aspect-square animate-pulse rounded-[2rem] bg-brand-100" />
      <div className="space-y-4 pt-4">
        <div className="h-4 w-24 animate-pulse rounded bg-brand-100" />
        <div className="h-14 w-3/4 animate-pulse rounded-xl bg-brand-100" />
        <div className="h-20 animate-pulse rounded-xl bg-brand-100" />
        <div className="h-10 w-40 animate-pulse rounded-xl bg-brand-100" />
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-brand-100" />
          ))}
        </div>
        <div className="h-12 animate-pulse rounded-xl bg-brand-100" />
      </div>
    </div>
  );
}
