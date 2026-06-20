import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpsertMyDefaultAddressDto {
  @IsUUID()
  deliveryZoneId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referencePoint?: string;
}
