import { createZodDto } from 'nestjs-zod';
import { orderQuerySchema, placeOrderSchema, updateOrderStatusSchema } from '@sweets/types';

export class PlaceOrderDto extends createZodDto(placeOrderSchema) {}
export class UpdateOrderStatusDto extends createZodDto(updateOrderStatusSchema) {}
export class OrderQueryDto extends createZodDto(orderQuerySchema) {}
