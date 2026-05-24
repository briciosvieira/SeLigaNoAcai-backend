import { Payment } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  orderId: string;
  paymentMethod: string;
  status: string;
  amount: string;
  provider: string | null;
  providerPaymentId: string | null;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  pixExpiresAt: Date | null;
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
    this.pixQrCode = payment.pixQrCode;
    this.pixCopyPaste = payment.pixCopyPaste;
    this.pixExpiresAt = payment.pixExpiresAt;
    this.installments = payment.installments;
    this.cardBrand = payment.cardBrand;
    this.cardLastDigits = payment.cardLastDigits;
    this.paidAt = payment.paidAt;
    this.failedReason = payment.failedReason;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}
