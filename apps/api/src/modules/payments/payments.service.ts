import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentProvider } from '@sweets/types';
import type { Env } from '../../config/env';
import type { Tx } from '../../prisma/prisma.service';
import { PAYMENT_GATEWAYS, type PaymentGateway } from './gateways/payment-gateway';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_GATEWAYS) private readonly gateways: PaymentGateway[],
    private readonly config: ConfigService<Env, true>,
  ) {}

  async initiate(
    tx: Tx,
    order: { id: string; orderNumber: string; total: { toString(): string } },
    provider: PaymentProvider,
  ) {
    const gateway = this.gateways.find((g) => g.provider === provider);
    if (!gateway) throw new BadRequestException(`Payment method ${provider} is not available`);

    const amount = order.total.toString();
    const intent = await gateway.createIntent({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount,
      currency: this.config.get('CURRENCY', { infer: true }),
    });
    const payment = await tx.payment.create({
      data: { orderId: order.id, provider, amount, providerRef: intent.providerRef },
    });
    return { payment, intent };
  }

  /** COD is collected on delivery. */
  markCodCollected(tx: Tx, orderId: string) {
    return tx.payment.updateMany({
      where: { orderId, provider: 'COD', status: 'PENDING' },
      data: { status: 'SUCCEEDED' },
    });
  }

  failPending(tx: Tx, orderId: string) {
    return tx.payment.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
  }
}
