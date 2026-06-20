import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus, { message: 'Status de pagamento inválido.' })
  paymentStatus: PaymentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
