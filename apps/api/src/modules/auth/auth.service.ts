import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthResponse, AuthUser, LoginInput, RegisterInput, Role } from '@sweets/types';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  vendorId: string | null;
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  vendorId: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  hashPassword(password: string) {
    return argon2.hash(password);
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email.toLowerCase() },
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('An account with this email or phone already exists');

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash: await this.hashPassword(input.password),
        role: 'CUSTOMER',
      },
      select: userSelect,
    });
    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(user);
  }

  /** Rotates the refresh token. Re-use of a revoked token revokes every session for that user. */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException();
    }
    if (stored.revokedAt) {
      await this.revokeAll(stored.userId);
      throw new UnauthorizedException();
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getUser(id: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private revokeAll(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: AuthUser): Promise<AuthResponse> {
    const payload: AccessTokenPayload = { sub: user.id, role: user.role, vendorId: user.vendorId };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        vendorId: user.vendorId,
      },
    };
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
