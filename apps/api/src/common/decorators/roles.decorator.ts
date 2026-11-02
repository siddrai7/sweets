import { SetMetadata } from '@nestjs/common';
import type { Role } from '@sweets/types';

export const ROLES_KEY = 'roles';

/** Restrict a route or controller to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
