import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @IsOptional()
  @IsString()
  tabletImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
