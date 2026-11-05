import { SweetArt } from '@/components/art/sweet-art';
import { artFor } from '@/lib/art';
import { svgToString } from '@/lib/svg-string';

/**
 * Illustrations as cacheable SVG files: /art/kaju-katli.svg, /art/ladoo.svg?bg=0&fit=meet.
 * Pages reference them with <img> so the drawing is downloaded once and cached, instead of
 * being inlined (and repeated in the page data) on every product card.
 */
export function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  return params.then(({ file }) => {
    const hint = decodeURIComponent(file).replace(/\.svg$/, '');
    if (!/^[a-z0-9-]{1,120}$/.test(hint)) return new Response('Not found', { status: 404 });
    const q = new URL(request.url).searchParams;
    const svg = svgToString(
      <SweetArt
        spec={artFor(hint)}
        background={q.get('bg') !== '0'}
        fit={q.get('fit') === 'meet' ? 'meet' : 'slice'}
      />,
    );
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        // The drawing for a name never changes between deploys of the same art code.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  });
}
