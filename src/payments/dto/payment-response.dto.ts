import type { Payment } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  orderId: string;
  paymentMethod: string;
  status: string;
  amount: string;
  provider: string | null;
  providerPaymentId: string | null;
  pixCopyPaste: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: Date | null;
  expiresAt: Date | null;
  installments: number | null;
  cardBrand: string | null;
  cardLastDigits: string | null;
  paidAt: Date | null;
  failedReason: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.orderId = payment.orderId;
    this.paymentMethod = payment.paymentMethod;
    this.status = payment.status;
    this.amount = payment.amount.toString();
    this.provider = payment.provider;
    this.providerPaymentId = payment.providerPaymentId;
    this.pixCopyPaste = payment.pixCopyPaste;
    this.pixQrCode = payment.pixQrCode;
    this.pixQrCodeBase64 = payment.pixQrCode;
    this.pixExpiresAt = payment.pixExpiresAt;
    this.expiresAt = payment.pixExpiresAt;
    this.installments = payment.installments;
    this.cardBrand = payment.cardBrand;
    this.cardLastDigits = payment.cardLastDigits;
    this.paidAt = payment.paidAt;
    this.failedReason = payment.failedReason;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}
