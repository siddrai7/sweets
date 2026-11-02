import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { RawMaterialsController, VendorsController } from './vendors.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  controllers: [VendorsController, RawMaterialsController, PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class VendorsModule {}
