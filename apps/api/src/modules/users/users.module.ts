import { Body, Controller, Get, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createUserSchema, paginationQuerySchema, ROLES } from '@sweets/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';

class CreateUserDto extends createZodDto(createUserSchema) {}
class UserQueryDto extends createZodDto(
  paginationQuerySchema.extend({ role: z.enum(ROLES).optional(), search: z.string().optional() }),
) {}
class SetActiveDto extends createZodDto(z.object({ isActive: z.boolean() })) {}

const select = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  vendorId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(@Query() q: UserQueryDto) {
    const where = {
      role: q.role,
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: 'insensitive' as const } },
          { email: { contains: q.search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, select, orderBy: { createdAt: 'desc' }, ...pageArgs(q) }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        role: dto.role,
        vendorId: dto.role === 'VENDOR' ? dto.vendorId : null,
        passwordHash: await this.auth.hashPassword(dto.password),
      },
      select,
    });
  }

  @Patch(':id/active')
  async setActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select,
    });
    if (!dto.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return user;
  }
}

@Module({ imports: [AuthModule], controllers: [UsersController] })
export class UsersModule {}
