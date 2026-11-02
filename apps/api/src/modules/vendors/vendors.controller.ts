import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { rawMaterialInputSchema, vendorInputSchema, vendorUpdateSchema } from '@sweets/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

class VendorDto extends createZodDto(vendorInputSchema) {}
class UpdateVendorDto extends createZodDto(vendorUpdateSchema) {}
class RawMaterialDto extends createZodDto(rawMaterialInputSchema) {}

@ApiTags('vendors')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: VendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }
}

@ApiTags('vendors')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('raw-materials')
export class RawMaterialsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.rawMaterial.findMany({ orderBy: { name: 'asc' } });
  }

  @Post()
  create(@Body() dto: RawMaterialDto) {
    return this.prisma.rawMaterial.create({ data: dto });
  }
}
