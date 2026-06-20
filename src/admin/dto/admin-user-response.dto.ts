import {
  AdminPermission,
  Customer,
  CustomerAdminPermission,
  UserRole,
} from '@prisma/client';

type AdminUserWithPermissions = Customer & {
  adminPermissions?: CustomerAdminPermission[];
};

export class AdminUserResponseDto {
  id: string;
  customerCode: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isGuest: boolean;
  isActive: boolean;
  authProvider: string;
  permissions: AdminPermission[];
  createdAt: Date;
  updatedAt: Date;

  constructor(customer: AdminUserWithPermissions) {
    this.id = customer.id;
    this.customerCode = customer.customerCode;
    this.fullName = customer.fullName;
    this.email = customer.email;
    this.phone = customer.phone;
    this.role = customer.role;
    this.isGuest = customer.isGuest;
    this.isActive = customer.isActive;
    this.authProvider = customer.authProvider;
    this.permissions =
      customer.adminPermissions?.map((item) => item.permission) ?? [];
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }
}
