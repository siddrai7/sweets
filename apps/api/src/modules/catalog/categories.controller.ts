import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryDto, UpdateCategoryDto } from './catalog.dto';

@ApiTags('catalog')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  list(@CurrentUser() user?: RequestUser) {
    const staff = user && user.role !== 'CUSTOMER';
    return this.prisma.category.findMany({
      where: staff ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Post()
  create(@Body() dto: CategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }
}
