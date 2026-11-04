import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

/** Customer self-service: a cart that follows them across devices, and saved addresses. */
@Module({
  imports: [InventoryModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
