import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import { CategoryDto, UpdateCategoryDto } from './catalog.dto';

@ApiTags('catalog')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  list(@CurrentUser() user?: RequestUser) {
    return this.catalog.listCategories(!!user && user.role !== 'CUSTOMER');
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Post()
  create(@Body() dto: CategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }
}
