import { Customer } from '@prisma/client';

export class CustomerResponseDto {
  id: string;
  customerCode: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  authProvider: string;
  role: string;
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
    this.authProvider = customer.authProvider;
    this.role = customer.role;
    this.isGuest = customer.isGuest;
    this.isActive = customer.isActive;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }
}
