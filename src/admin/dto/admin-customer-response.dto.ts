import { AuthProvider, Customer, UserRole } from '@prisma/client';

export class AdminCustomerResponseDto {
  id: string;
  customerCode: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  role: UserRole;
  authProvider: AuthProvider;
  isGuest: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.customerCode = customer.customerCode;
    this.fullName = customer.fullName;
    this.email = customer.email;
    this.phone = customer.phone;
    this.cpf = customer.cpf;
    this.role = customer.role;
    this.authProvider = customer.authProvider;
    this.isGuest = customer.isGuest;
    this.isActive = customer.isActive;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }
}
