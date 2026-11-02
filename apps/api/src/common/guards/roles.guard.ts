import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@sweets/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const user: RequestUser | undefined = context.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
