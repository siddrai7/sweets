import { Injectable } from '@nestjs/common';
import type { PaymentGateway } from './payment-gateway';

@Injectable()
export class CodGateway implements PaymentGateway {
  readonly provider = 'COD' as const;

  async createIntent() {
    return { providerRef: null, clientPayload: null, confirmImmediately: true };
  }
}
