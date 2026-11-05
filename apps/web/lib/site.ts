/**
 * Business details shown across the site. Everything here is a placeholder until the
 * client confirms it — search the codebase for `site.` to see where each value appears.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Mithai House',
  tagline: 'Handcrafted sweets, made fresh every morning',
  established: '1989',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  description:
    'Traditional Indian sweets, dry fruit mithai, namkeen and bakes, handcrafted daily in pure ghee and delivered fresh to your door.',
  currency: 'INR',
  /** Must match FREE_DELIVERY_ABOVE in the API env. */
  freeDeliveryAbove: Number(process.env.NEXT_PUBLIC_FREE_DELIVERY_ABOVE ?? 999),
  /** Must match DELIVERY_FEE in the API env. Charged on delivery orders below the threshold. */
  deliveryFee: Number(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? 49),
  delivery: {
    /** Shown in the header and on product pages. */
    eta: '60–90 min',
    /** Used to estimate arrival on the order page. Keep in step with `eta`. */
    etaMinutes: { min: 60, max: 90 },
    area: 'Thane & Navi Mumbai',
    sameDayCutoff: '2 pm',
    /** 24-hour clock; orders after this are delivered the next morning. */
    sameDayCutoffHour: 14,
    pickupReady: 'about 1 hour',
    pickupReadyMinutes: 60,
  },
  contact: {
    phone: '+91 98765 43210',
    email: 'hello@example.com',
    whatsapp: '919876543210',
    address: 'Shop No. 1, Main Road, Thane West, Maharashtra 400601',
    /** Structured parts of the address and hours, for Google's business listing. */
    street: 'Shop No. 1, Main Road, Thane West',
    city: 'Thane',
    state: 'Maharashtra',
    postalCode: '400601',
    hours: 'Open daily, 8:30 am – 10:00 pm',
    opens: '08:30',
    closes: '22:00',
  },
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },
  /** Rotates in the top bar. */
  announcements: [
    'Free delivery on orders above ₹999',
    'Made fresh every morning in pure desi ghee',
    'Same-day delivery on orders placed before 2 pm',
  ],
  /** Suggested in the search box before the customer types. */
  popularSearches: [
    'Kaju katli',
    'Motichoor ladoo',
    'Rasmalai',
    'Sugar free',
    'Namkeen',
    'Gift box',
  ],
};
