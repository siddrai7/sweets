/**
 * Homepage content. Phase A keeps this in code; a later phase moves banners and
 * testimonials into the ERP so the client can edit them without a deploy.
 */

export interface HeroSlide {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  /** Tailwind classes for the slide background until real banner photography exists. */
  theme: string;
  image?: string;
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: 'Since 1989',
    title: 'Sweets made fresh every single morning',
    body: 'Traditional recipes, pure ghee and the finest ingredients, handcrafted in our kitchen and delivered to your door.',
    cta: { label: 'Shop all sweets', href: '/shop' },
    theme: 'from-brand-700 via-brand-600 to-brand-500',
  },
  {
    eyebrow: 'Dry fruit collection',
    title: 'Kaju katli, pista katli and more',
    body: 'Premium cashew, pistachio and fig sweets. The gift everyone hopes to receive.',
    cta: { label: 'Explore dry fruit sweets', href: '/shop/dry-fruit-sweets' },
    theme: 'from-saffron-600 via-saffron-500 to-saffron-400',
  },
  {
    eyebrow: 'Tea-time favourites',
    title: 'Crunchy namkeen and fresh snacks',
    body: 'Aloo bhujia, kachori, dhokla and the snacks that make every evening better.',
    cta: { label: 'Shop namkeen', href: '/shop/namkeen' },
    theme: 'from-pista-600 via-[#6f8c3f] to-[#8aa356]',
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
