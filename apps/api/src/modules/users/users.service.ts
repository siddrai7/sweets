import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  VENDOR_LINK_REQUIRED,
  type CreateUserInput,
  type ManagedUser,
  type Paginated,
  type UpdateUserInput,
  type UserQuery,
} from '@sweets/types';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const select = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  vendorId: true,
  vendor: { select: { id: true, name: true } },
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type Row = Prisma.UserGetPayload<{ select: typeof select }>;

const toDto = (u: Row): ManagedUser => ({
  ...u,
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  createdAt: u.createdAt.toISOString(),
});

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async list(q: UserQuery): Promise<Paginated<ManagedUser>> {
    const where: Prisma.UserWhereInput = {
      role:
        q.role ??
        (q.audience === 'team'
          ? { not: 'CUSTOMER' }
          : q.audience === 'customers'
            ? 'CUSTOMER'
            : undefined),
      isActive: q.isActive,
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: 'insensitive' } },
          { email: { contains: q.search, mode: 'insensitive' } },
          { phone: { contains: q.search } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        ...pageArgs(q),
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items.map(toDto), total, q);
  }

  async create(input: CreateUserInput): Promise<ManagedUser> {
    const email = input.email.toLowerCase();
    const phone = input.phone || null;
    await this.assertUnique(email, phone);
    const vendorId = input.role === 'VENDOR' ? await this.assertVendor(input.vendorId) : null;

    const user = await this.unique(() =>
      this.auth.hashPassword(input.password).then((passwordHash) =>
        this.prisma.user.create({
          data: { name: input.name, email, phone, role: input.role, vendorId, passwordHash },
          select,
        }),
      ),
    );
    return toDto(user);
  }

  async update(actorId: string, id: string, input: UpdateUserInput): Promise<ManagedUser> {
    const current = await this.find(id);
    const role = input.role ?? current.role;

    if (id === actorId && role !== current.role) {
      throw new BadRequestException(
        'You can’t change your own role. Ask another admin to do it, so the business never loses its last admin.',
      );
    }

    // A vendor link only makes sense for VENDOR accounts, and they always need one.
    let vendorId: string | null = null;
    if (role === 'VENDOR') {
      vendorId = await this.assertVendor(
        input.vendorId !== undefined ? input.vendorId : current.vendorId,
      );
    }

    const phone = input.phone === undefined ? undefined : input.phone || null;
    if (phone && phone !== current.phone) await this.assertUnique(undefined, phone, id);

    const user = await this.unique(() =>
      this.prisma.user.update({
        where: { id },
        data: { name: input.name, phone, role, vendorId },
        select,
      }),
    );

    // Permissions live in the access token; force a fresh sign-in when they change.
    if (role !== current.role || vendorId !== current.vendorId) await this.auth.revokeAll(id);
    return toDto(user);
  }

  async setActive(actorId: string, id: string, isActive: boolean): Promise<ManagedUser> {
    if (id === actorId && !isActive) {
      throw new BadRequestException('You can’t deactivate your own account.');
    }
    await this.find(id);
    const user = await this.prisma.user.update({ where: { id }, data: { isActive }, select });
    if (!isActive) await this.auth.revokeAll(id);
    return toDto(user);
  }

  async resetPassword(id: string, password: string): Promise<void> {
    await this.find(id);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await this.auth.hashPassword(password) },
    });
    await this.auth.revokeAll(id);
  }

  private async find(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, vendorId: true, phone: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertVendor(vendorId: string | null | undefined): Promise<string> {
    if (!vendorId) throw new BadRequestException(VENDOR_LINK_REQUIRED);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!vendor) throw new BadRequestException('That vendor does not exist');
    return vendor.id;
  }

  /** Friendly 409s for the common case; `unique()` still catches races. */
  private async assertUnique(email: string | undefined, phone: string | null, exceptId?: string) {
    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (phone) or.push({ phone });
    if (!or.length) return;
    const clash = await this.prisma.user.findFirst({
      where: { OR: or, ...(exceptId && { id: { not: exceptId } }) },
      select: { email: true },
    });
    if (clash) {
      throw new ConflictException(
        email && clash.email === email
          ? 'An account with this email already exists'
          : 'An account with this phone number already exists',
      );
    }
  }

  private async unique<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('An account with this email or phone already exists');
      }
      throw e;
    }
  }
}
