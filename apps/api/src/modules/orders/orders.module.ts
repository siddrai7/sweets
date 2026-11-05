import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MarketingModule } from '../marketing/marketing.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController, ReturnsController } from './orders.controller';
import { InvoicesService } from './invoices.service';
import { ReturnsService } from './returns.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [InventoryModule, PaymentsModule, AccountModule, DeliveryModule, MarketingModule],
  controllers: [OrdersController, ReturnsController],
  providers: [OrdersService, InvoicesService, ReturnsService],
})
export class OrdersModule {}
