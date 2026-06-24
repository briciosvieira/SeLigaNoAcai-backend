import { Customer } from '@prisma/client';

export class AuthUserResponseDto {
  id: string;
  customerCode: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  avatarUrl: string | null;
  googleAvatarUrl: string | null;
  role: string;
  authProvider: string;
  isGuest: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  termsAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
  termsVersion: string | null;
  privacyVersion: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.customerCode = customer.customerCode;
    this.fullName = customer.fullName;
    this.email = customer.email;
    this.phone = customer.phone;
    this.cpf = customer.cpf;
    this.avatarUrl = customer.avatarUrl;
    this.googleAvatarUrl = customer.googleAvatarUrl;
    this.role = customer.role;
    this.authProvider = customer.authProvider;
    this.isGuest = customer.isGuest;
    this.isActive = customer.isActive;
    this.mustChangePassword = customer.mustChangePassword;
    this.termsAcceptedAt = customer.termsAcceptedAt;
    this.privacyAcceptedAt = customer.privacyAcceptedAt;
    this.termsVersion = customer.termsVersion;
    this.privacyVersion = customer.privacyVersion;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }
}

export class AuthResponseDto {
  user: AuthUserResponseDto;
  accessToken: string;
  refreshToken: string;

  constructor(customer: Customer, accessToken: string, refreshToken: string) {
    this.user = new AuthUserResponseDto(customer);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
