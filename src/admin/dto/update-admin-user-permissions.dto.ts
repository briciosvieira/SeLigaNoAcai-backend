import { AdminPermission } from '@prisma/client';
import { ArrayUnique, IsArray, IsEnum } from 'class-validator';

export class UpdateAdminUserPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(AdminPermission, { each: true })
  permissions!: AdminPermission[];
}
