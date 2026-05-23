import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  displayOrder?: number;
}
