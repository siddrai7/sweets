import { z } from 'zod';
import { MAX_CART_LINES } from './constants.js';
import { addressSchema } from './orders.js';

export const cartItemsSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .max(MAX_CART_LINES),
});
export type CartItemsInput = z.infer<typeof cartItemsSchema>;

// Base shape has no defaults so the `.partial()` update schema never resets omitted fields.
const savedAddressBaseSchema = addressSchema.extend({
  /** e.g. "Home", "Office", "Mum's place". */
  label: z.string().trim().max(30).nullable().optional(),
  isDefault: z.boolean(),
});

export const savedAddressInputSchema = savedAddressBaseSchema.extend({
  isDefault: z.boolean().default(false),
});
export type SavedAddressInput = z.infer<typeof savedAddressInputSchema>;

export const savedAddressUpdateSchema = savedAddressBaseSchema.partial();
export type SavedAddressUpdateInput = z.infer<typeof savedAddressUpdateSchema>;
