/** "Kaju Katli" + "kaju-katli" → "kaju-katli-kaju-katli": a stable, URL-safe illustration key. */
export function artKey(...hints: (string | null | undefined)[]) {
  return hints
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** URL of the cached SVG illustration for a product or category. */
export function artSrc(
  hints: (string | null | undefined)[],
  { background = true, fit = 'slice' }: { background?: boolean; fit?: 'slice' | 'meet' } = {},
) {
  const q = new URLSearchParams();
  if (!background) q.set('bg', '0');
  if (fit === 'meet') q.set('fit', 'meet');
  const qs = q.toString();
  return `/art/${artKey(...hints) || 'sweets'}.svg${qs ? `?${qs}` : ''}`;
}
