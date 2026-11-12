import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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

/** The logo badge as a data URI, for generated images. Read once, when the image is built. */
export async function logoDataUri() {
  const file = await readFile(join(process.cwd(), 'public', 'logo.png'));
  return `data:image/png;base64,${file.toString('base64')}`;
}
