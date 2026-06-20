import { PaymentMethod } from '@prisma/client';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateManualPaymentDto {
  @IsIn([PaymentMethod.CASH_ON_DELIVERY, PaymentMethod.CARD_ON_DELIVERY], {
    message:
      'Método manual permitido apenas para dinheiro ou cartão na entrega.',
  })
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;
}
