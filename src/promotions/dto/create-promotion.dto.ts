import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PromotionType } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  eligibleProductIds?: string[];

  @IsOptional()
  @IsUUID()
  buyProductId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  buyQuantity?: number;

  @IsOptional()
  @IsUUID()
  rewardProductId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rewardQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
