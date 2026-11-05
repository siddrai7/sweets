import { SweetArt } from '@/components/art/sweet-art';
import { artFor } from './art';
import { svgToString } from './svg-string';

/** A product illustration as a data URI, for generated images (share cards, app icons). */
export function artDataUri(hint: string, background = true) {
  const svg = svgToString(<SweetArt spec={artFor(hint)} background={background} />).replace(
    '<svg',
    '<svg width="600" height="600"',
  );
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** The monogram, as markup usable inside an ImageResponse. */
export const MONOGRAM_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="400" height="400"><circle cx="20" cy="20" r="19" fill="#7d1b28"/><circle cx="20" cy="20" r="16.2" fill="none" stroke="#d9ae5b" stroke-width="0.8"/><g fill="#e8c987">' +
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map(
        (a) =>
          `<path d="M20 8.5c1.9 2.6 1.9 5.2 0 7.6-1.9-2.4-1.9-5 0-7.6Z" transform="rotate(${a} 20 20)"/>`,
      )
      .join('') +
    '<circle cx="20" cy="20" r="2.6"/></g></svg>',
).toString('base64')}`;
