import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CouponsController, ReviewsController, ShopperController } from './marketing.controller';
import { CouponsService } from './coupons.service';
import { ReviewsService } from './reviews.service';
import { ShopperListsService } from './shopper-lists.service';

/** Coupons, reviews, wishlists and back-in-stock requests. */
@Module({
  imports: [CatalogModule],
  controllers: [CouponsController, ReviewsController, ShopperController],
  providers: [CouponsService, ReviewsService, ShopperListsService],
  exports: [CouponsService, ShopperListsService],
})
export class MarketingModule {}
