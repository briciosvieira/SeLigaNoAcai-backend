import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerAddressDto {
  @IsOptional()
  @IsString()
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  referencePoint?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}