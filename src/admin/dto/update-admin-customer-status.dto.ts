import { IsBoolean } from 'class-validator';

export class UpdateAdminCustomerStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
