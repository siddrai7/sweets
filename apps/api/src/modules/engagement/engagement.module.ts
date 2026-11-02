import { Body, Controller, Get, HttpCode, Module, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createZodDto } from 'nestjs-zod';
import { contactMessageSchema, newsletterSchema, paginationQuerySchema } from '@sweets/types';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';

class NewsletterDto extends createZodDto(newsletterSchema) {}
class ContactMessageDto extends createZodDto(contactMessageSchema) {}
class PageQueryDto extends createZodDto(paginationQuerySchema) {}

/** Public website forms: newsletter signup and the contact form. */
@ApiTags('engagement')
@Controller()
class EngagementController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(204)
  @Post('newsletter')
  async subscribe(@Body() dto: NewsletterDto) {
    const email = dto.email.toLowerCase();
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { unsubscribedAt: null },
      create: { email },
    });
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(204)
  @Post('contact')
  async contact(@Body() dto: ContactMessageDto) {
    await this.prisma.contactMessage.create({ data: { ...dto, email: dto.email.toLowerCase() } });
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'STAFF')
  @Get('contact')
  async messages(@Query() q: PageQueryDto) {
    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, ...pageArgs(q) }),
      this.prisma.contactMessage.count(),
    ]);
    return paginated(items, total, q);
  }
}

@Module({ controllers: [EngagementController] })
export class EngagementModule {}
