import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MAX_SAVED_ADDRESSES,
  type AddressInput,
  type CartItemsInput,
  type CartView,
  type SavedAddress,
  type SavedAddressInput,
  type SavedAddressUpdateInput,
} from '@sweets/types';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

const addressSelect = {
  id: true,
  label: true,
  name: true,
  phone: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  pincode: true,
  isDefault: true,
} satisfies Prisma.AddressSelect;

/** Same address typed twice (case and spacing aside) is one address. */
const addressKey = (a: Omit<AddressInput, 'line2'> & { line2?: string | null }) =>
  [a.name, a.phone.replace(/\D/g, ''), a.line1, a.line2 ?? '', a.city, a.state, a.pincode]
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, ' '))
    .join('|');

/**
 * The signed-in customer's own cart and address book. The cart lives on the server so it
 * follows the customer between devices; it stores only variant + quantity and is always
 * returned with current prices and stock.
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  // ── Cart ──

  async getCart(userId: string): Promise<CartView> {
    const rows = await this.prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        variant: {
          include: {
            product: { select: { slug: true, name: true, images: true, isActive: true } },
          },
        },
      },
    });
    // Drop sizes that have since been withdrawn from sale.
    const stale = rows.filter((r) => !r.variant.isActive || !r.variant.product.isActive);
    if (stale.length) {
      await this.prisma.cartItem.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
    }
    const live = rows.filter((r) => !stale.includes(r));
    const available = await this.inventory.availableByVariant(live.map((r) => r.variantId));
    return {
      items: live.map((r) => ({
        variantId: r.variantId,
        quantity: r.quantity,
        productSlug: r.variant.product.slug,
        productName: r.variant.product.name,
        variantLabel: r.variant.label,
        unitPrice: r.variant.price.toString(),
        mrp: r.variant.mrp?.toString() ?? null,
        image: r.variant.product.images[0] ?? null,
        available: available.get(r.variantId) ?? 0,
      })),
    };
  }

  /** Replace the whole cart with what the customer's device has. */
  async replaceCart(userId: string, { items }: CartItemsInput): Promise<CartView> {
    const valid = await this.sellable(items);
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({
        where: { userId, variantId: { notIn: valid.map((i) => i.variantId) } },
      }),
      ...valid.map((i) =>
        this.prisma.cartItem.upsert({
          where: { userId_variantId: { userId, variantId: i.variantId } },
          create: { userId, variantId: i.variantId, quantity: i.quantity },
          update: { quantity: i.quantity },
        }),
      ),
    ]);
    return this.getCart(userId);
  }

  /**
   * Fold a signed-out cart into the account at sign-in. Takes the larger quantity per item
   * (rather than adding) so signing in twice never doubles anything.
   */
  async mergeCart(userId: string, { items }: CartItemsInput): Promise<CartView> {
    const valid = await this.sellable(items);
    const existing = new Map(
      (
        await this.prisma.cartItem.findMany({
          where: { userId },
          select: { variantId: true, quantity: true },
        })
      ).map((r) => [r.variantId, r.quantity]),
    );
    await this.prisma.$transaction(
      valid.map((i) => {
        const quantity = Math.max(i.quantity, existing.get(i.variantId) ?? 0);
        return this.prisma.cartItem.upsert({
          where: { userId_variantId: { userId, variantId: i.variantId } },
          create: { userId, variantId: i.variantId, quantity },
          update: { quantity },
        });
      }),
    );
    return this.getCart(userId);
  }

  /** Keep only sizes that exist and are on sale; collapse duplicates. */
  private async sellable(items: CartItemsInput['items']) {
    const byVariant = new Map<string, number>();
    for (const i of items) byVariant.set(i.variantId, Math.min(100, i.quantity));
    if (!byVariant.size) return [];
    const ok = await this.prisma.productVariant.findMany({
      where: { id: { in: [...byVariant.keys()] }, isActive: true, product: { isActive: true } },
      select: { id: true },
    });
    return ok.map((v) => ({ variantId: v.id, quantity: byVariant.get(v.id)! }));
  }

  // ── Addresses ──

  listAddresses(userId: string): Promise<SavedAddress[]> {
    return this.prisma.address.findMany({
      where: { userId },
      select: addressSelect,
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  /** Adds an address, or returns the existing one if it's already saved. */
  async createAddress(userId: string, input: SavedAddressInput): Promise<SavedAddress> {
    const all = await this.prisma.address.findMany({ where: { userId } });
    const key = addressKey(input);
    const duplicate = all.find((a) => addressKey(a) === key);
    if (duplicate) {
      return this.updateAddress(userId, duplicate.id, {
        label: input.label ?? duplicate.label,
        isDefault: input.isDefault || duplicate.isDefault,
      });
    }
    if (all.length >= MAX_SAVED_ADDRESSES) {
      throw new BadRequestException(
        `You can save up to ${MAX_SAVED_ADDRESSES} addresses. Remove one to add another.`,
      );
    }
    const isDefault = input.isDefault || all.length === 0;
    return this.prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({
        data: {
          ...input,
          line2: input.line2 || null,
          // Addresses saved from checkout arrive unlabelled; call the first one "Home".
          label: input.label ?? (all.length === 0 ? 'Home' : null),
          userId,
          isDefault,
        },
        select: addressSelect,
      });
    });
  }

  async updateAddress(
    userId: string,
    id: string,
    input: SavedAddressUpdateInput,
  ): Promise<SavedAddress> {
    await this.ownAddress(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        // There is always exactly one default while any address exists.
        data: { ...input, isDefault: input.isDefault === false ? undefined : input.isDefault },
        select: addressSelect,
      });
    });
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    const address = await this.ownAddress(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
  }

  private async ownAddress(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== userId) throw new NotFoundException('Address not found');
    return address;
  }
}
