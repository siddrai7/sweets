import Image from 'next/image';

/** Warm gradients for placeholder art, picked deterministically from the product slug. */
const PALETTES = [
  ['#f6e3c0', '#e9b450', '#8e1b1f'],
  ['#f4ebdc', '#d4b98f', '#721519'],
  ['#edf2e1', '#a9bf7a', '#5d7a34'],
  ['#fbe3e1', '#e9a3a0', '#8e1b1f'],
  ['#fbefd5', '#d9962b', '#6b3d0f'],
  ['#f1e6f3', '#c8a2cf', '#5b2a63'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Props {
  name: string;
  slug: string;
  src?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Product photo, or a branded placeholder until real photography exists.
 * The placeholder is pure SVG, so it is crisp at any size and costs nothing to load.
 */
export function ProductImage({
  name,
  slug,
  src,
  sizes = '(min-width: 1024px) 25vw, 50vw',
  priority,
  className = '',
}: Props) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-brand-100 ${className}`}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  const h = hash(slug);
  const [bg, mid, ink] = PALETTES[h % PALETTES.length]!;
  const shape = h % 3; // 0 = round (ladoo/pedha), 1 = diamond (katli), 2 = square (barfi)
  const id = `p-${slug}`;

  return (
    <div className={`relative overflow-hidden ${className}`} role="img" aria-label={name}>
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor={bg} />
          </radialGradient>
          <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mid} />
            <stop offset="100%" stopColor={ink} stopOpacity="0.85" />
          </linearGradient>
          <pattern id={`${id}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={ink} fillOpacity="0.08" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#${id}-bg)`} />
        <rect width="200" height="200" fill={`url(#${id}-dots)`} />
        <ellipse cx="100" cy="150" rx="62" ry="10" fill={ink} fillOpacity="0.1" />
        {shape === 0 && (
          <>
            <circle cx="100" cy="100" r="48" fill={`url(#${id}-s)`} />
            <circle cx="86" cy="84" r="12" fill="#fff" fillOpacity="0.25" />
          </>
        )}
        {shape === 1 && (
          <>
            <path d="M100 48 152 100 100 152 48 100Z" fill={`url(#${id}-s)`} />
            <path d="M100 64 136 100 100 136 64 100Z" fill="#fff" fillOpacity="0.15" />
          </>
        )}
        {shape === 2 && (
          <>
            <rect x="56" y="62" width="88" height="76" rx="10" fill={`url(#${id}-s)`} />
            <rect x="56" y="62" width="88" height="18" rx="10" fill="#fff" fillOpacity="0.22" />
          </>
        )}
      </svg>
    </div>
  );
}
