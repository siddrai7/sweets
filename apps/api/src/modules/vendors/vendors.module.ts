import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { RawMaterialsController, VendorsController } from './vendors.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { VendorsService } from './vendors.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VendorsController, RawMaterialsController, PurchaseOrdersController],
  providers: [PurchaseOrdersService, VendorsService],
})
export class VendorsModule {}
