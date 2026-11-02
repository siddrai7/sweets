import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [InventoryModule],
  controllers: [CategoriesController, ProductsController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
