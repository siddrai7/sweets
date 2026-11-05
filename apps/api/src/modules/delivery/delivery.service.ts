import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_DELIVERY_SETTINGS,
  deliverySettingsSchema,
  type BulkServiceAreaInput,
  type DeliverySettings,
  type DeliverySlot,
  type PlaceOrderInput,
  type ServiceAreaInput,
} from '@sweets/types';
import { withUniqueMessages } from '../../common/utils/prisma-errors';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays, dayLabel, istDate, istMinutes, istMoment, timeLabel, toMinutes } from './ist';

const SETTINGS_KEY = 'delivery';

/**
 * Where and when the shop delivers. Service areas limit pincodes (none configured = all
 * accepted); delivery settings define slots, lead time, the same-day cutoff and closures.
 * Order placement calls `assertDeliverable` so the storefront's promises are enforced.
 */
@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async settings(): Promise<DeliverySettings> {
    const row = await this.prisma.storeSetting.findUnique({ where: { key: SETTINGS_KEY } });
    const parsed = deliverySettingsSchema.safeParse(row?.value);
    return parsed.success ? parsed.data : DEFAULT_DELIVERY_SETTINGS;
  }

  async updateSettings(input: DeliverySettings) {
    const value = { ...input, closedDates: [...new Set(input.closedDates)].sort() };
    await this.prisma.storeSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value },
      update: { value },
    });
    return value;
  }

  // ── Service areas ──

  areas() {
    return this.prisma.serviceArea.findMany({ orderBy: [{ label: 'asc' }, { pincode: 'asc' }] });
  }

  createArea(input: ServiceAreaInput) {
    return withUniqueMessages(() => this.prisma.serviceArea.create({ data: input }), {
      pincode: 'That pincode is already in the list',
    });
  }

  /** Add many pincodes under one label; existing ones are relabelled and re-enabled. */
  async bulkAreas({ pincodes, label }: BulkServiceAreaInput) {
    const unique = [...new Set(pincodes)];
    await this.prisma.$transaction(
      unique.map((pincode) =>
        this.prisma.serviceArea.upsert({
          where: { pincode },
          create: { pincode, label },
          update: { label, isActive: true },
        }),
      ),
    );
    return { added: unique.length };
  }

  async updateArea(id: string, input: Partial<ServiceAreaInput>) {
    await this.findArea(id);
    return withUniqueMessages(
      () => this.prisma.serviceArea.update({ where: { id }, data: input }),
      {
        pincode: 'That pincode is already in the list',
      },
    );
  }

  async deleteArea(id: string) {
    await this.findArea(id);
    await this.prisma.serviceArea.delete({ where: { id } });
  }

  private async findArea(id: string) {
    const a = await this.prisma.serviceArea.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Pincode not found');
    return a;
  }

  async check(pincode: string) {
    const configured = await this.prisma.serviceArea.count({ where: { isActive: true } });
    if (!configured) return { pincode, serviceable: true, label: null };
    const area = await this.prisma.serviceArea.findFirst({ where: { pincode, isActive: true } });
    return { pincode, serviceable: !!area, label: area?.label ?? null };
  }

  // ── Slots ──

  /** Bookable delivery windows from now, honouring lead time, cutoff, closures and capacity. */
  async slots(now = new Date()): Promise<DeliverySlot[]> {
    const s = await this.settings();
    if (!s.slots.length) return [];
    const today = istDate(now);
    const nowMin = istMinutes(now);
    const pastCutoff = nowMin >= toMinutes(s.sameDayCutoff);

    const candidates: {
      date: string;
      def: DeliverySettings['slots'][number];
      start: Date;
      end: Date;
    }[] = [];
    for (let d = 0; d < s.daysAhead; d++) {
      const date = addDays(today, d);
      if (s.closedDates.includes(date)) continue;
      if (d === 0 && pastCutoff) continue;
      for (const def of s.slots) {
        const start = istMoment(date, def.start);
        if (start.getTime() - now.getTime() < s.leadMinutes * 60_000) continue;
        candidates.push({ date, def, start, end: istMoment(date, def.end) });
      }
    }
    if (!candidates.length) return [];

    const booked = await this.prisma.order.groupBy({
      by: ['deliverySlotStart'],
      where: {
        deliverySlotStart: { in: candidates.map((c) => c.start) },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      _count: true,
    });
    const taken = new Map(booked.map((b) => [b.deliverySlotStart!.getTime(), b._count]));

    return candidates.map(({ date, def, start, end }) => ({
      start: start.toISOString(),
      end: end.toISOString(),
      date,
      label: `${dayLabel(date, today)}, ${timeLabel(def.start)} – ${timeLabel(def.end)}`,
      available: !def.capacity || (taken.get(start.getTime()) ?? 0) < def.capacity,
    }));
  }

  /** Throws with a customer-friendly message if a delivery order can't be fulfilled. */
  async assertDeliverable(input: PlaceOrderInput) {
    if (input.fulfillment !== 'DELIVERY') return;
    const pincode = input.address?.pincode;
    if (pincode) {
      const { serviceable } = await this.check(pincode);
      if (!serviceable) {
        throw new BadRequestException(
          `Sorry, we don't deliver to ${pincode} yet. You can choose store pickup instead.`,
        );
      }
    }
    const slots = await this.slots();
    const settings = await this.settings();
    if (!settings.slots.length) return; // no slots configured: deliver as soon as possible
    if (!input.deliverySlotStart) {
      throw new BadRequestException(
        slots.some((sl) => sl.available)
          ? 'Please choose a delivery slot.'
          : 'There are no delivery slots left right now. Please choose store pickup.',
      );
    }
    const chosen = slots.find((sl) => sl.start === input.deliverySlotStart!.toISOString());
    if (!chosen || !chosen.available) {
      throw new BadRequestException(
        'That delivery slot is no longer available. Please pick another.',
      );
    }
  }
}
