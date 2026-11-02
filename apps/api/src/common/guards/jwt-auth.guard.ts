import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';
import type { AccessTokenPayload } from '../../modules/auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const token = this.extractToken(request);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      request.user = { id: payload.sub, role: payload.role, vendorId: payload.vendorId };
    } catch {
      if (!isPublic) throw new UnauthorizedException();
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
