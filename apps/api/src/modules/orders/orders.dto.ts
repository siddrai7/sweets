import { createZodDto } from 'nestjs-zod';
import {
  approveReturnSchema,
  orderQuerySchema,
  placeOrderSchema,
  rejectReturnSchema,
  returnQuerySchema,
  returnRequestSchema,
  staffRefundSchema,
  updateOrderStatusSchema,
} from '@sweets/types';

export class PlaceOrderDto extends createZodDto(placeOrderSchema) {}
export class UpdateOrderStatusDto extends createZodDto(updateOrderStatusSchema) {}
export class OrderQueryDto extends createZodDto(orderQuerySchema) {}
export class ReturnRequestDto extends createZodDto(returnRequestSchema) {}
export class StaffRefundDto extends createZodDto(staffRefundSchema) {}
export class ApproveReturnDto extends createZodDto(approveReturnSchema) {}
export class RejectReturnDto extends createZodDto(rejectReturnSchema) {}
export class ReturnQueryDto extends createZodDto(returnQuerySchema) {}
