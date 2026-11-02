import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [InventoryModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
