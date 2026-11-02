import { createZodDto } from 'nestjs-zod';
import {
  categoryInputSchema,
  categoryUpdateSchema,
  productInputSchema,
  productQuerySchema,
  productUpdateSchema,
} from '@sweets/types';

export class CategoryDto extends createZodDto(categoryInputSchema) {}
export class UpdateCategoryDto extends createZodDto(categoryUpdateSchema) {}
export class ProductDto extends createZodDto(productInputSchema) {}
export class UpdateProductDto extends createZodDto(productUpdateSchema) {}
export class ProductQueryDto extends createZodDto(productQuerySchema) {}
