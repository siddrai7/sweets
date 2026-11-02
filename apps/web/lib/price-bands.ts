/**
 * Price bands for the shop filter. They apply to the smallest pack size (the "from" price on
 * each card). Lives outside the 'use client' controls so server components can read it too.
 */
export const PRICE_BANDS = [
  { id: 'u200', label: 'Under ₹200', max: 199 },
  { id: '200-400', label: '₹200 – ₹400', min: 200, max: 400 },
  { id: '400-800', label: '₹400 – ₹800', min: 400, max: 800 },
  { id: 'o800', label: 'Above ₹800', min: 800 },
] as const;
