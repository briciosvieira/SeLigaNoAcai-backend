import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @Type(() => Number)
  @IsNumber()
  basePrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isOffer?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
