import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  imageUrl: string;

  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @Type(() => Date)
  @IsDate()
  endAt: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
