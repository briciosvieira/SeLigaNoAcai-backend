import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCardPaymentDto {
  @IsString()
  cardToken: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'A quantidade de parcelas deve ser no mínimo 1.' })
  installments?: number;

  @IsOptional()
  @IsString()
  cardBrand?: string;

  @IsOptional()
  @IsString()
  cardLastDigits?: string;
}
