import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

/**
 * Field behind a unique-constraint violation (P2002), e.g. "slug" or "sku".
 * Prisma's classic engine reports `meta.target`; the pg driver adapter reports the
 * constraint name instead ("Product_slug_key"), so both are handled.
 */
export function uniqueViolationField(e: unknown): string | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return null;
  const meta = (e.meta ?? {}) as {
    target?: string[] | string;
    driverAdapterError?: { cause?: { constraint?: { index?: string; fields?: string[] } } };
  };
  if (Array.isArray(meta.target)) return meta.target[0] ?? '';
  const constraint = meta.driverAdapterError?.cause?.constraint;
  if (constraint?.fields?.[0]) return constraint.fields[0];
  const index = constraint?.index ?? (typeof meta.target === 'string' ? meta.target : '');
  // "<Model>_<field>_key"
  return index.match(/^[^_]+_(.+)_key$/)?.[1] ?? '';
}

/**
 * Runs a write and turns unique-constraint violations into a 409 with a readable message.
 * `messages` maps a field name to its message; `fallback` covers anything else.
 */
export async function withUniqueMessages<T>(
  fn: () => Promise<T>,
  messages: Record<string, string>,
  fallback = 'That value is already in use',
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const field = uniqueViolationField(e);
    if (field === null) throw e;
    throw new ConflictException(messages[field] ?? fallback);
  }
}
