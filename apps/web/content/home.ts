/**
 * Homepage content. Phase A keeps this in code; a later phase moves banners into the ERP so
 * the client can edit them without a deploy. Customer quotes are deliberately absent: the
 * shop is new, so the only reviews shown are real ones on product pages.
 */

/** Promo cards under the hero. `art` picks the illustration until banner photography exists. */
export interface Banner {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  art: string;
  tone: 'wine' | 'pista' | 'saffron';
  image?: string;
}

export const banners: Banner[] = [
  {
    eyebrow: 'Festive gifting',
    title: 'Dry fruit boxes they’ll remember',
    body: 'Kaju katli, pista katli and anjeer rolls, gift-packed by hand.',
    cta: { label: 'Shop gifting', href: '/shop/dry-fruit-sweets' },
    art: 'kaju-katli',
    tone: 'wine',
  },
  {
    eyebrow: 'No added sugar',
    title: 'All the joy, none of the sugar',
    body: 'Dates, figs and nuts, slow-cooked in pure ghee.',
    cta: { label: 'Shop sugar-free', href: '/shop/sugar-free' },
    art: 'anjeer-roll',
    tone: 'pista',
  },
  {
    eyebrow: 'Tea-time',
    title: 'Namkeen, crisp and fresh',
    body: 'Aloo bhujia, khatta meetha and evening snacks.',
    cta: { label: 'Shop namkeen', href: '/shop/namkeen' },
    art: 'aloo-bhujia',
    tone: 'saffron',
  },
];

export const promises = [
  {
    title: 'Fresh daily',
    body: 'Made in small batches and sold fresh, never stored for weeks.',
    icon: 'sun',
  },
  {
    title: 'Pure ghee',
    body: 'Only pure desi ghee and full-cream milk, no shortcuts.',
    icon: 'drop',
  },
  {
    title: 'No preservatives',
    body: 'Nothing artificial. Just honest ingredients and proven recipes.',
    icon: 'leaf',
  },
  {
    title: 'Handcrafted',
    body: 'Rolled, cut and packed by hand, one batch at a time.',
    icon: 'hand',
  },
] as const;
