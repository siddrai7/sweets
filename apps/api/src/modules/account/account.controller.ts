import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { cartItemsSchema, savedAddressInputSchema, savedAddressUpdateSchema } from '@sweets/types';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { AccountService } from './account.service';

class CartItemsDto extends createZodDto(cartItemsSchema) {}
class AddressDto extends createZodDto(savedAddressInputSchema) {}
class UpdateAddressDto extends createZodDto(savedAddressUpdateSchema) {}

/** The signed-in user's own cart and address book. */
@ApiTags('account')
@ApiBearerAuth()
@Controller('me')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('cart')
  cart(@CurrentUser() user: RequestUser) {
    return this.account.getCart(user.id);
  }

  @Put('cart')
  replaceCart(@CurrentUser() user: RequestUser, @Body() dto: CartItemsDto) {
    return this.account.replaceCart(user.id, dto);
  }

  /** Called once at sign-in with the cart the customer built while signed out. */
  @Post('cart/merge')
  mergeCart(@CurrentUser() user: RequestUser, @Body() dto: CartItemsDto) {
    return this.account.mergeCart(user.id, dto);
  }

  @Get('addresses')
  addresses(@CurrentUser() user: RequestUser) {
    return this.account.listAddresses(user.id);
  }

  @Post('addresses')
  createAddress(@CurrentUser() user: RequestUser, @Body() dto: AddressDto) {
    return this.account.createAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.account.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(204)
  deleteAddress(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.account.deleteAddress(user.id, id);
  }
}
