/**
 * Homepage content. Phase A keeps this in code; a later phase moves banners and
 * testimonials into the ERP so the client can edit them without a deploy.
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
    body: 'Made every morning in small batches, never stored for weeks.',
    icon: 'sun',
  },
  {
    title: 'Pure ghee',
    body: 'Only pure desi ghee and full-cream milk, no shortcuts.',
    icon: 'drop',
  },
  {
    title: 'No preservatives',
    body: 'Nothing artificial. Just honest, traditional recipes.',
    icon: 'leaf',
  },
  {
    title: 'Handcrafted',
    body: 'Shaped by hand by karigars with decades of experience.',
    icon: 'hand',
  },
] as const;

export const testimonials = [
  {
    quote:
      'The kaju katli is exactly how I remember it from my childhood. Thin, smooth and not too sweet. Our whole family orders from here for every festival.',
    name: 'Priya S.',
    place: 'Thane',
  },
  {
    quote:
      'Ordered rasmalai for a house party and it arrived perfectly chilled and packed. Guests kept asking where it was from!',
    name: 'Rohan M.',
    place: 'Navi Mumbai',
  },
  {
    quote:
      'Their motichoor ladoo is the best I have had in Mumbai. Fresh every time, you can taste the ghee.',
    name: 'Anjali K.',
    place: 'Kalyan',
  },
  {
    quote:
      'Great namkeen selection and the dry fruit ladoo with no sugar is perfect for my parents.',
    name: 'Vikram P.',
    place: 'Thane',
  },
];

/** Products in the hero collage: one large, two small. Use slugs that exist in the catalog. */
export const heroFeatures = [
  { slug: 'kaju-katli', name: 'Kaju Katli', note: 'Our signature' },
  { slug: 'motichoor-ladoo', name: 'Motichoor Ladoo' },
  { slug: 'kesar-rasmalai', name: 'Kesar Rasmalai' },
];
