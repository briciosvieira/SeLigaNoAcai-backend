import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID do produto é obrigatório.' })
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'A quantidade deve ser no mínimo 1.' })
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
