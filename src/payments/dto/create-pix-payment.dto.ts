import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePixPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(300, { message: 'A expiração mínima do PIX deve ser de 5 minutos.' })
  expirationSeconds?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
