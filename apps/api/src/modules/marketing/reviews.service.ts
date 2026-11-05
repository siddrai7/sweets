import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ReviewInput, ReviewModerationInput, ReviewQuery } from '@sweets/types';
import { Prisma } from '../../generated/prisma/client';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { StorefrontCacheService } from '../catalog/storefront-cache.service';

/** "Priya Sharma" → "Priya S." */
export const authorName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.pop();
  return last ? `${first} ${last[0]!.toUpperCase()}.` : (first ?? 'Customer');
};

const withUser = { user: { select: { name: true } } } satisfies Prisma.ReviewInclude;
type ReviewRow = Prisma.ReviewGetPayload<{ include: typeof withUser }>;
const publicShape = ({ user, userId: _u, moderationNote: _m, orderId: _o, ...r }: ReviewRow) => ({
  ...r,
  author: authorName(user.name),
});

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storefront: StorefrontCacheService,
  ) {}

  private async productId(idOrSlug: string) {
    const p = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p.id;
  }

  /** Approved reviews for the product page, with the star breakdown. */
  async forProduct(idOrSlug: string, page = 1, pageSize = 10) {
    const productId = await this.productId(idOrSlug);
    const where = { productId, status: 'APPROVED' as const };
    const [items, total, groups] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: withUser,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({ by: ['rating'], where, _count: true }),
    ]);
    const distribution = [0, 0, 0, 0, 0] as [number, number, number, number, number];
    let sum = 0;
    for (const g of groups) {
      distribution[g.rating - 1] = g._count;
      sum += g.rating * g._count;
    }
    return {
      items: items.map(publicShape),
      total,
      average: total ? Math.round((sum / total) * 10) / 10 : null,
      distribution,
    };
  }

  /** The delivered order that lets this customer review the product, if any. */
  private purchase(productId: string, userId: string) {
    return this.prisma.order.findFirst({
      where: {
        customerId: userId,
        status: { in: ['DELIVERED', 'REFUNDED'] },
        items: { some: { variant: { productId } } },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  }

  async eligibility(idOrSlug: string, userId: string) {
    const productId = await this.productId(idOrSlug);
    const [order, review] = await Promise.all([
      this.purchase(productId, userId),
      this.prisma.review.findUnique({
        where: { productId_userId: { productId, userId } },
        include: withUser,
      }),
    ]);
    return {
      canReview: !!order,
      reason: !order ? 'not-purchased' : review ? 'already-reviewed' : null,
      review: review ? publicShape(review) : null,
    };
  }

  /** Verified buyers only. Editing a review sends it back for approval. */
  async upsert(idOrSlug: string, userId: string, input: ReviewInput) {
    const productId = await this.productId(idOrSlug);
    const order = await this.purchase(productId, userId);
    if (!order) {
      throw new ForbiddenException('You can review sweets once you’ve received them');
    }
    const data = {
      rating: input.rating,
      title: input.title || null,
      body: input.body || null,
      status: 'PENDING' as const,
      orderId: order.id,
    };
    const before = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
      select: { status: true },
    });
    const review = await this.prisma.review.upsert({
      where: { productId_userId: { productId, userId } },
      create: { ...data, productId, userId },
      update: data,
      include: withUser,
    });
    if (before?.status === 'APPROVED') await this.recompute(productId);
    return publicShape(review);
  }

  async list(q: ReviewQuery) {
    const where: Prisma.ReviewWhereInput = { status: q.status };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { ...withUser, product: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        ...pageArgs(q),
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginated(
      items.map((r) => ({
        ...publicShape(r),
        product: r.product,
        moderationNote: r.moderationNote,
      })),
      total,
      q,
    );
  }

  async moderate(id: string, input: ReviewModerationInput) {
    const review = await this.prisma.review
      .update({
        where: { id },
        data: { status: input.status, moderationNote: input.moderationNote ?? null },
        include: withUser,
      })
      .catch(() => {
        throw new NotFoundException('Review not found');
      });
    await this.recompute(review.productId);
    return publicShape(review);
  }

  /** Keeps Product.ratingAvg/ratingCount in step and refreshes the storefront's pages. */
  private async recompute(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingCount: agg._count,
        ratingAvg: agg._avg.rating === null ? null : agg._avg.rating.toFixed(2),
      },
    });
    this.storefront.catalogChanged();
  }
}
