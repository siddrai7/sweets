import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  userQuerySchema,
} from '@sweets/types';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

class CreateUserDto extends createZodDto(createUserSchema) {}
class UpdateUserDto extends createZodDto(updateUserSchema) {}
class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
class UserQueryDto extends createZodDto(userQuerySchema) {}
class SetActiveDto extends createZodDto(z.object({ isActive: z.boolean() })) {}

@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() q: UserQueryDto) {
    return this.users.list(q);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(@CurrentUser() actor: RequestUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(actor.id, id, dto);
  }

  @Patch(':id/active')
  setActive(@CurrentUser() actor: RequestUser, @Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.users.setActive(actor.id, id, dto.isActive);
  }

  /** Sets a new password and signs the user out everywhere. */
  @Post(':id/password')
  @HttpCode(204)
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.users.resetPassword(id, dto.password);
  }
}
