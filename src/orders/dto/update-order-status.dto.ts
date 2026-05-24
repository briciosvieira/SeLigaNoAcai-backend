import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty({ message: 'O status do pedido é obrigatório.' })
  orderStatus: OrderStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
