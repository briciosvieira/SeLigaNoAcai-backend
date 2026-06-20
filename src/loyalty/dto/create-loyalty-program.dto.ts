import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLoyaltyProgramDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do programa é obrigatório.' })
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'A quantidade de compras deve ser no mínimo 1.' })
  purchasesRequired?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'O valor mínimo não pode ser negativo.' })
  minimumOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'A validade deve ser no mínimo 1 mês.' })
  validityMonths?: number;

  @IsOptional()
  @IsString()
  rewardDescription?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
