import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Human-friendly reference like `SW-261010-7KQ4XM`. Columns are unique, so a clash fails loudly. */
export function referenceNumber(prefix: string, date = new Date()): string {
  const ymd = date.toISOString().slice(2, 10).replaceAll('-', '');
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${ymd}-${suffix}`;
}
