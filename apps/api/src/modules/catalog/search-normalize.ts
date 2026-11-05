/**
 * Customers spell sweets many ways. Map common variants to the spelling used in the
 * catalogue before matching, so "laddu", "burfi" or "rosogolla" still find the product.
 * Staff can add more per product as "Other names" (searchAliases) in the ERP.
 */
const VARIANTS: [RegExp, string][] = [
  [/\b(laddu|laddoo|ladu|laddus|ladoos|laddoos|lado)\b/g, 'ladoo'],
  [/\b(burfi|barfee|burfee|barfis|burfis)\b/g, 'barfi'],
  [
    /\b(rosogolla|rasagola|rasgola|roshogolla|rossogolla|rasagulla|rasgullas|rosogollas)\b/g,
    'rasgulla',
  ],
  [/\b(katri|katari|kattli|katlee)\b/g, 'katli'],
  [/\b(peda|pera|pedas|pedhas)\b/g, 'pedha'],
  [/\b(halva|halvah)\b/g, 'halwa'],
  [/\b(namkin|namkeens|nimki)\b/g, 'namkeen'],
  [/\b(kachauri|kachodi|kachouri|kachoris)\b/g, 'kachori'],
  [/\b(bhujiya|bujia|bhujia)\b/g, 'bhujia'],
  [/\b(dokla|dhoklas)\b/g, 'dhokla'],
  [/\b(rasmalai|ras malai|rasmalaai)\b/g, 'rasmalai'],
  [/\b(cashew|cashews)\b/g, 'kaju'],
  [/\b(pistachio|pistachios)\b/g, 'pista'],
  [/\b(saffron)\b/g, 'kesar'],
  [/\b(badam|almonds)\b/g, 'almond'],
  [/\b(anjir|figs?)\b/g, 'anjeer'],
  [/\b(biscuits?|cookie)\b/g, 'cookies'],
  [/\bsugar ?free\b/g, 'sugar free'],
  [/\b(mithai|mithais|sweet)\b/g, 'sweets'],
];

/** Lowercase, punctuation to spaces, collapse whitespace. Mirrors the SQL haystack. */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function normalizeQuery(raw: string) {
  let q = fold(raw);
  for (const [re, to] of VARIANTS) q = q.replace(re, to);
  return q.replace(/\s+/g, ' ').trim();
}

/** Words that must all appear; very short words ("of", "a") are ignored. */
export function queryTokens(normalized: string) {
  return [...new Set(normalized.split(' ').filter((t) => t.length >= 2))].slice(0, 8);
}
