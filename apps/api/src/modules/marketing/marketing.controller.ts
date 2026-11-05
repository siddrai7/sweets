import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createZodDto } from 'nestjs-zod';
import {
  couponCheckSchema,
  couponInputSchema,
  couponUpdateSchema,
  reviewInputSchema,
  reviewModerationSchema,
  reviewQuerySchema,
  stockAlertSchema,
} from '@sweets/types';
import { z } from 'zod';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CatalogService } from '../catalog/catalog.service';
import { CouponsService } from './coupons.service';
import { ReviewsService } from './reviews.service';
import { ShopperListsService } from './shopper-lists.service';

class CouponDto extends createZodDto(couponInputSchema) {}
class CouponUpdateDto extends createZodDto(couponUpdateSchema) {}
class CouponCheckDto extends createZodDto(couponCheckSchema) {}
class ReviewDto extends createZodDto(reviewInputSchema) {}
class ModerateDto extends createZodDto(reviewModerationSchema) {}
class ReviewQueryDto extends createZodDto(reviewQuerySchema) {}
class PageDto extends createZodDto(z.object({ page: z.coerce.number().int().min(1).default(1) })) {}
class IdsDto extends createZodDto(
  z.object({ ids: z.string().transform((s) => s.split(',').filter(Boolean).slice(0, 30)) }),
) {}
class StockAlertDto extends createZodDto(
  stockAlertSchema.extend({ variantId: z.string().min(1) }),
) {}

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  /** Checkout: preview a code against the cart. Works for guests too. */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('check')
  check(@Body() dto: CouponCheckDto, @CurrentUser() user?: RequestUser) {
    return this.coupons.check(dto, user?.id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Get()
  list() {
    return this.coupons.list();
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CouponDto) {
    return this.coupons.create(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CouponUpdateDto) {
    return this.coupons.update(id, dto);
  }
}

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('products/:idOrSlug/reviews')
  forProduct(@Param('idOrSlug') idOrSlug: string, @Query() q: PageDto) {
    return this.reviews.forProduct(idOrSlug, q.page);
  }

  @ApiBearerAuth()
  @Get('products/:idOrSlug/reviews/mine')
  mine(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user: RequestUser) {
    return this.reviews.eligibility(idOrSlug, user.id);
  }

  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Put('products/:idOrSlug/reviews/mine')
  write(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviews.upsert(idOrSlug, user.id, dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Get('reviews')
  list(@Query() q: ReviewQueryDto) {
    return this.reviews.list(q);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Patch('reviews/:id')
  moderate(@Param('id') id: string, @Body() dto: ModerateDto) {
    return this.reviews.moderate(id, dto);
  }
}

@ApiTags('shopper')
@Controller()
export class ShopperController {
  constructor(
    private readonly lists: ShopperListsService,
    private readonly catalog: CatalogService,
  ) {}

  /** "Frequently bought together" for a product page. */
  @Public()
  @Get('catalog/together/:idOrSlug')
  together(@Param('idOrSlug') idOrSlug: string) {
    return this.catalog.boughtTogether(idOrSlug);
  }

  /** Products by id, in that order (recently viewed). */
  @Public()
  @Get('catalog/by-ids')
  byIds(@Query() q: IdsDto) {
    return this.catalog.productsByIds(q.ids as unknown as string[]);
  }

  /** Products for these sizes, to rebuild a past order's cart. */
  @Public()
  @Get('catalog/by-variants')
  byVariants(@Query() q: IdsDto) {
    return this.catalog.productsForVariants(q.ids as unknown as string[]);
  }

  @ApiBearerAuth()
  @Get('me/wishlist')
  wishlist(@CurrentUser() user: RequestUser) {
    return this.lists.wishlist(user.id);
  }

  @ApiBearerAuth()
  @Get('me/wishlist/ids')
  wishlistIds(@CurrentUser() user: RequestUser) {
    return this.lists.wishlistIds(user.id);
  }

  @ApiBearerAuth()
  @Put('me/wishlist/:productId')
  addToWishlist(@Param('productId') productId: string, @CurrentUser() user: RequestUser) {
    return this.lists.addToWishlist(user.id, productId);
  }

  @ApiBearerAuth()
  @Delete('me/wishlist/:productId')
  removeFromWishlist(@Param('productId') productId: string, @CurrentUser() user: RequestUser) {
    return this.lists.removeFromWishlist(user.id, productId);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('stock-alerts')
  stockAlert(@Body() dto: StockAlertDto) {
    return this.lists.requestStockAlert(dto.variantId, dto.email);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Get('stock-alerts')
  pendingStockAlerts() {
    return this.lists.pendingStockAlerts();
  }
}
