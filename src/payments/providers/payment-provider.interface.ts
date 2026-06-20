import { PaymentStatus } from '@prisma/client';

export type CreatePaymentProviderParams = {
  orderId: string;
  amount: string;
  customerName?: string | null;
  customerCpf?: string | null;
  customerCnpj?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  description?: string;
};

export type CreatePaymentProviderResult = {
  provider: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  pixExpiresAt?: Date | null;
  installments?: number | null;
  cardBrand?: string | null;
  cardLastDigits?: string | null;
};

export type ConfirmPaymentProviderResult = {
  providerPaymentId: string | null;
  status: PaymentStatus;
  paidAt?: Date | null;
  failedReason?: string | null;
};

export interface PaymentProvider {
  createPayment(
    params: CreatePaymentProviderParams,
  ): Promise<CreatePaymentProviderResult>;

  getPaymentStatus(
    providerPaymentId: string,
  ): Promise<ConfirmPaymentProviderResult>;
}
