import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { CatalogService } from './catalog.service';
import { StorefrontCacheService } from './storefront-cache.service';

@Module({
  imports: [InventoryModule],
  controllers: [CategoriesController, ProductsController],
  providers: [CatalogService, StorefrontCacheService],
  exports: [CatalogService],
})
export class CatalogModule {}
