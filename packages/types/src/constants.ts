/**
 * Plain values with no zod dependency, so browser code can import them without pulling
 * the validation library into the bundle: `import { PRODUCT_SORTS } from '@sweets/types/constants'`.
 */
export * from './enums.js';

/** Most items a cart may hold; protects the API from oversized payloads. */
export const MAX_CART_LINES = 100;

/** Saved addresses per customer. */
export const MAX_SAVED_ADDRESSES = 10;

/** Message used wherever a VENDOR account is missing its supplier link. */
export const VENDOR_LINK_REQUIRED = 'Vendor accounts must be linked to a vendor';

/** Roles that make up the business's own team, as opposed to shoppers. */
export const USER_AUDIENCES = ['team', 'customers'] as const;
export type UserAudience = (typeof USER_AUDIENCES)[number];

export const PRODUCT_SORTS = [
  'featured',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'newest',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Hours after delivery in which a customer can report a problem online. */
export const RETURN_WINDOW_HOURS = 24;

/** Indian GSTIN: 2-digit state code, PAN, entity number, "Z", checksum. */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
