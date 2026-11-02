import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@sweets/types';

export interface RequestUser {
  id: string;
  role: Role;
  vendorId: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined =>
    ctx.switchToHttp().getRequest().user,
);
