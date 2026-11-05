import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  bulkServiceAreaSchema,
  deliverySettingsSchema,
  indianPincodeSchema,
  serviceAreaInputSchema,
} from '@sweets/types';
import { z } from 'zod';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeliveryService } from './delivery.service';

class AreaDto extends createZodDto(serviceAreaInputSchema) {}
class UpdateAreaDto extends createZodDto(serviceAreaInputSchema.partial()) {}
class BulkAreaDto extends createZodDto(bulkServiceAreaSchema) {}
class SettingsDto extends createZodDto(deliverySettingsSchema) {}
class CheckDto extends createZodDto(z.object({ pincode: indianPincodeSchema })) {}

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  /** Does the shop deliver to this pincode? */
  @Public()
  @Get('check')
  check(@Query() q: CheckDto) {
    return this.delivery.check(q.pincode);
  }

  /** Bookable delivery slots from now. */
  @Public()
  @Get('slots')
  slots() {
    return this.delivery.slots();
  }

  @Public()
  @Get('settings')
  settings() {
    return this.delivery.settings();
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Put('settings')
  updateSettings(@Body() dto: SettingsDto) {
    return this.delivery.updateSettings(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Get('areas')
  areas() {
    return this.delivery.areas();
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post('areas')
  createArea(@Body() dto: AreaDto) {
    return this.delivery.createArea(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post('areas/bulk')
  bulk(@Body() dto: BulkAreaDto) {
    return this.delivery.bulkAreas(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch('areas/:id')
  updateArea(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.delivery.updateArea(id, dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete('areas/:id')
  @HttpCode(204)
  deleteArea(@Param('id') id: string) {
    return this.delivery.deleteArea(id);
  }
}
