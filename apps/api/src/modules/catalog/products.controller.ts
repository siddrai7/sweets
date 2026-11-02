import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ProductDto, ProductQueryDto, UpdateProductDto } from './catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  list(@Query() q: ProductQueryDto, @CurrentUser() user?: RequestUser) {
    const staff = !!user && user.role !== 'CUSTOMER';
    return this.catalog.listProducts({ ...q, includeInactive: staff && q.includeInactive });
  }

  /** Lookup by slug (storefront) or id (ERP). */
  @Public()
  @Get(':idOrSlug')
  get(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user?: RequestUser) {
    return this.catalog.getProduct(idOrSlug, !!user && user.role !== 'CUSTOMER');
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Post()
  create(@Body() dto: ProductDto) {
    return this.catalog.createProduct(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: RequestUser) {
    // Archiving and restoring are admin decisions (see DELETE below).
    if (dto.isActive !== undefined && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can archive or restore products');
    }
    return this.catalog.updateProduct(id, dto);
  }

  /** Undo an archive: the product shows on the shop again. */
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.catalog.updateProduct(id, { isActive: true });
  }

  /** Soft delete: products referenced by past orders must keep existing. */
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.catalog.updateProduct(id, { isActive: false });
  }
}
