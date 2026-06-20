import { IsOptional, IsString } from 'class-validator';

export class DashboardFilterDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
