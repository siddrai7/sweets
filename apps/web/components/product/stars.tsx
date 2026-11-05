import { StarIcon } from '@/components/ui/icons';

/** Five stars filled to `value` (e.g. 4.3), for ratings. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="relative inline-flex text-brand-200" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} size={size} />
      ))}
      <span
        className="absolute inset-0 inline-flex overflow-hidden text-saffron-500"
        style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} size={size} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

/** "★★★★☆ 4.3 (28)" */
export function RatingSummary({
  average,
  count,
  size = 14,
  className = '',
}: {
  average: number;
  count: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Stars value={average} size={size} />
      <span className="font-bold tabular-nums">{average.toFixed(1)}</span>
      <span className="text-cocoa-soft">
        ({count}
        <span className="sr-only"> reviews</span>)
      </span>
    </span>
  );
}
