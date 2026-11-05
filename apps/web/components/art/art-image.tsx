import { artSrc } from '@/lib/art-url';

/** A decorative illustration, served as a cached SVG file (see app/art/[file]/route.tsx). */
export function ArtImage({
  hints,
  background = true,
  fit = 'slice',
  className = '',
  priority,
  alt = '',
}: {
  hints: (string | null | undefined)[];
  background?: boolean;
  fit?: 'slice' | 'meet';
  className?: string;
  /** Above-the-fold images load eagerly with high priority. */
  priority?: boolean;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed
    <img
      src={artSrc(hints, { background, fit })}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      draggable={false}
      className={`select-none object-cover ${className}`}
    />
  );
}
