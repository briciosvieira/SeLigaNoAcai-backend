import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductOptionGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID do grupo de opções é obrigatório.' })
  optionGroupId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSelected?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSelected?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}