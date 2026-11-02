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
  contact: {
    phone: '+91 98765 43210',
    email: 'hello@example.com',
    whatsapp: '919876543210',
    address: 'Shop No. 1, Main Road, Thane West, Maharashtra 400601',
    hours: 'Open daily, 8:30 am – 10:00 pm',
  },
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },
  announcement: 'Free delivery on orders above ₹999 · Made fresh every morning in pure ghee',
};
