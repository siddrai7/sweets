import { describe, expect, it } from 'vitest';
import { artFor } from './art';
import { artKey, artSrc } from './art-url';

describe('illustrations', () => {
  it('builds stable, URL-safe keys', () => {
    expect(artKey('kaju-katli', 'Kaju Katli')).toBe('kaju-katli-kaju-katli');
    expect(artSrc(['Dry Fruit Ladoo'], { background: false })).toBe(
      '/art/dry-fruit-ladoo.svg?bg=0',
    );
  });
  it('picks the same drawing from a key as from the original names', () => {
    for (const [slug, name] of [
      ['dry-fruit-ladoo', 'Dry Fruit Ladoo'],
      ['anjeer-roll', 'Anjeer Roll'],
      ['sugar-free', 'Sugar-free'],
      ['kesar-rasmalai', 'Kesar Rasmalai'],
    ] as const) {
      expect(artFor(artKey(slug, name))).toEqual(artFor(slug, name));
    }
  });
});
