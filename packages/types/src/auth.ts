import { z } from 'zod';
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

/** Admin-only: create staff / vendor / admin accounts. */
export const createUserSchema = registerSchema.extend({
  role: z.enum(ROLES),
  vendorId: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
