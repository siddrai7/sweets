import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z.email().max(200),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email().max(200),
  phone: z.string().max(15).optional(),
  subject: z.string().max(150).optional(),
  message: z.string().min(5).max(3000),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
