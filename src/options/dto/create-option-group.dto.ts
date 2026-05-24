import { SelectionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOptionGroupDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsEnum(SelectionType)
  selectionType: SelectionType;

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
