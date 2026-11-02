/**
 * Picks an illustration for a product or category from its name/slug, until real photography
 * exists. Pure data, so both server and client components can import it.
 */

export type ArtKind =
  | 'ladoo'
  | 'katli'
  | 'barfi'
  | 'pedha'
  | 'balls'
  | 'rasmalai'
  | 'halwa'
  | 'namkeen'
  | 'mix'
  | 'dhokla'
  | 'kachori'
  | 'cookies'
  | 'biscotti'
  | 'roll'
  | 'assorted';

export interface ArtTone {
  body: string;
  light: string;
  dark: string;
  /** Backdrop tint. */
  bg: string;
  /** Syrup / milk colour for bowl sweets. */
  liquid?: string;
}

export interface ArtSpec {
  kind: ArtKind;
  tone: ArtTone;
  /** Garnish drawn on top. */
  garnish?: 'silver' | 'pista' | 'saffron' | 'nuts' | 'seeds' | 'none';
}

const TONES = {
  motichoor: { body: '#e98f2c', light: '#f8c463', dark: '#b4561a', bg: '#fbe8cf' },
  besan: { body: '#dba54b', light: '#f1cd81', dark: '#a26f25', bg: '#f7ecda' },
  dryfruit: { body: '#7c4b2f', light: '#a8734c', dark: '#4e2b19', bg: '#f1e4d8' },
  cashew: { body: '#efdfc2', light: '#fbf3e3', dark: '#c6a97f', bg: '#f2ebe0' },
  pista: { body: '#bccb91', light: '#dee7bb', dark: '#7e9257', bg: '#e8efdc' },
  kesar: { body: '#f2c66d', light: '#fbe3a6', dark: '#c88f2e', bg: '#fbefd6' },
  coconut: { body: '#f7f2e8', light: '#ffffff', dark: '#d5c9b3', bg: '#ecefe8' },
  caramel: { body: '#c98a4b', light: '#e7b47c', dark: '#8f5524', bg: '#f5e6d4' },
  rasgulla: {
    body: '#fbf6ea',
    light: '#ffffff',
    dark: '#d9cdb5',
    bg: '#e9eff0',
    liquid: '#f3e8c6',
  },
  rasmalai: {
    body: '#fbf0da',
    light: '#ffffff',
    dark: '#e0c79a',
    bg: '#fbeedb',
    liquid: '#f5d995',
  },
  halwa: { body: '#d98b2b', light: '#f0b556', dark: '#9e5a16', bg: '#fbe7cf' },
  namkeen: { body: '#d9a033', light: '#f2c861', dark: '#9c6a16', bg: '#faefd5' },
  dhokla: { body: '#f2cf4a', light: '#fbe78c', dark: '#c89e1e', bg: '#f8f3d3' },
  kachori: { body: '#c98a3e', light: '#e8b56f', dark: '#8c5a20', bg: '#f5e8d6' },
  cookie: { body: '#e2b877', light: '#f4d8a5', dark: '#b0814a', bg: '#f5ece0' },
  fig: { body: '#8a4e3a', light: '#ba7b60', dark: '#5a2c1f', bg: '#f2e3dc' },
  wine: { body: '#c0563f', light: '#e58c6a', dark: '#7d1b28', bg: '#f6e5dc' },
} satisfies Record<string, ArtTone>;

/** First match wins. Order matters: specific names before generic ones. */
const RULES: [RegExp, ArtSpec][] = [
  [/motichoor|boondi/, { kind: 'ladoo', tone: TONES.motichoor, garnish: 'seeds' }],
  [/dry-?fruit.*ladoo|dink|ladoo.*dry/, { kind: 'ladoo', tone: TONES.dryfruit, garnish: 'nuts' }],
  [/besan|ladoo|laddu/, { kind: 'ladoo', tone: TONES.besan, garnish: 'nuts' }],
  [/pista.*katli|pista/, { kind: 'katli', tone: TONES.pista, garnish: 'silver' }],
  [/katli|kaju|dry-?fruit|gift/, { kind: 'katli', tone: TONES.cashew, garnish: 'silver' }],
  [/milk-?cake/, { kind: 'barfi', tone: TONES.caramel, garnish: 'none' }],
  [/coconut/, { kind: 'barfi', tone: TONES.coconut, garnish: 'pista' }],
  [/kesar.*barfi|barfi|burfi/, { kind: 'barfi', tone: TONES.kesar, garnish: 'pista' }],
  [/pedha|peda/, { kind: 'pedha', tone: TONES.kesar, garnish: 'pista' }],
  [/rasmalai|ras-?malai/, { kind: 'rasmalai', tone: TONES.rasmalai, garnish: 'pista' }],
  [/rasgulla|rosogolla|bengali|chhena|sandesh/, { kind: 'balls', tone: TONES.rasgulla }],
  [/gulab|jamun/, { kind: 'balls', tone: { ...TONES.dryfruit, liquid: '#e9b45a' } }],
  [/halwa|halva/, { kind: 'halwa', tone: TONES.halwa, garnish: 'nuts' }],
  [/khatta|mix|chivda|chiwda/, { kind: 'mix', tone: TONES.namkeen }],
  [/bhujia|sev|namkeen/, { kind: 'namkeen', tone: TONES.namkeen }],
  [/dhokla|khaman/, { kind: 'dhokla', tone: TONES.dhokla, garnish: 'seeds' }],
  [/kachori|samosa|snack/, { kind: 'kachori', tone: TONES.kachori }],
  [/biscotti/, { kind: 'biscotti', tone: TONES.cookie, garnish: 'nuts' }],
  [/cookie|biscuit|bakery|nankhatai/, { kind: 'cookies', tone: TONES.cookie }],
  [/anjeer|fig|roll|sugar-?free/, { kind: 'roll', tone: TONES.fig, garnish: 'nuts' }],
  [/sweet|mithai/, { kind: 'assorted', tone: TONES.kesar }],
];

const FALLBACK: ArtSpec = { kind: 'assorted', tone: TONES.wine };

export function artFor(...hints: (string | null | undefined)[]): ArtSpec {
  const text = hints.filter(Boolean).join(' ').toLowerCase();
  return RULES.find(([re]) => re.test(text))?.[1] ?? FALLBACK;
}
