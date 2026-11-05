import { z } from 'zod';
import { USER_AUDIENCES } from './constants.js';
import { VENDOR_LINK_REQUIRED } from './constants.js';
import { paginationQuerySchema } from './common.js';
import { ROLES } from './enums.js';

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().min(8).max(15).optional(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

// Base shape carries no defaults so the `.partial()` update schema never resets omitted fields.
const userBaseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(8).max(15).nullable().optional(),
  role: z.enum(ROLES),
  /** Required for VENDOR accounts: the supplier they sign in on behalf of. */
  vendorId: z.string().nullable().optional(),
});

/** Admin-only: create staff / vendor / admin accounts. */
export const createUserSchema = userBaseSchema
  .extend({
    email: z.email(),
    password: z.string().min(8).max(128),
  })
  .refine((u) => u.role !== 'VENDOR' || !!u.vendorId, {
    message: VENDOR_LINK_REQUIRED,
    path: ['vendorId'],
  });
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Admin-only: edit a user's profile, role or vendor link. Email stays fixed (it is the login). */
export const updateUserSchema = userBaseSchema.partial();
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Admin-only: set a new password for someone who is locked out. Signs them out everywhere. */
export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(ROLES).optional(),
  /** `team` = ADMIN, STAFF and VENDOR; `customers` = CUSTOMER. Ignored when `role` is set. */
  audience: z.enum(USER_AUDIENCES).optional(),
  search: z.string().trim().optional(),
  isActive: z.stringbool().optional(),
});
export type UserQuery = z.infer<typeof userQuerySchema>;
