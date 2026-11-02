import { Controller, HttpCode, Module, NotImplementedException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CodGateway } from './gateways/cod.gateway';
import { PAYMENT_GATEWAYS, type PaymentGateway } from './gateways/payment-gateway';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
class PaymentsController {
  /**
   * Gateway webhooks land here. Each gateway must verify its signature against the raw body
   * before PaymentsService.markSucceeded / markFailed is called.
   */
  @Public()
  @HttpCode(200)
  @Post('webhooks/:provider')
  webhook(@Param('provider') provider: string) {
    throw new NotImplementedException(`Webhook handling for ${provider} is not configured yet`);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [
    CodGateway,
    {
      provide: PAYMENT_GATEWAYS,
      inject: [CodGateway],
      useFactory: (...gateways: PaymentGateway[]) => gateways,
    },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
