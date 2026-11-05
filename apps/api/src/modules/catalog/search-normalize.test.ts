import { describe, expect, it } from 'vitest';
import { normalizeQuery, queryTokens } from './search-normalize';

describe('normalizeQuery', () => {
  it.each([
    ['Laddu', 'ladoo'],
    ['motichoor laddoo', 'motichoor ladoo'],
    ['Kesar Burfi', 'kesar barfi'],
    ['rosogolla', 'rasgulla'],
    ['kaju katri', 'kaju katli'],
    ['Sugar-free', 'sugar free'],
    ['sugarfree sweets', 'sugar free sweets'],
    ['MITHAI', 'sweets'],
    ['cashew barfi', 'kaju barfi'],
    ['  besan   ladoo!! ', 'besan ladoo'],
  ])('%s → %s', (input, out) => expect(normalizeQuery(input)).toBe(out));

  it('splits into distinct meaningful tokens', () => {
    expect(queryTokens('box of ladoo ladoo')).toEqual(['box', 'of', 'ladoo']);
    expect(queryTokens('a')).toEqual([]);
  });
});
