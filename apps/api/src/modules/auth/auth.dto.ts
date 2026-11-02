import { createZodDto } from 'nestjs-zod';
import { loginSchema, refreshSchema, registerSchema } from '@sweets/types';

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
