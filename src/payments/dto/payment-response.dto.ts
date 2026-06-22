import type { Payment } from '@prisma/client';

function maskDocument(doc: string | null | undefined): string | null {
  if (!doc) return null;
  const digits = doc.replace(/\D/g, '');
  if (digits.length <= 4) return '***';
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export class PaymentResponseDto {
  id: string;
  orderId: string;
  paymentMethod: string;
  status: string;
  amount: string;
  amountPaid: string | null;
  provider: string | null;
  providerPaymentId: string | null;
  txid: string | null;
  providerEndToEndId: string | null;
  pixCopyPaste: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: Date | null;
  expiresAt: Date | null;
  installments: number | null;
  cardBrand: string | null;
  cardLastDigits: string | null;
  payerName: string | null;
  payerDocumentMasked: string | null;
  payerBank: string | null;
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
    this.amountPaid = payment.amountPaid ? payment.amountPaid.toString() : null;
    this.provider = payment.provider;
    this.providerPaymentId = payment.providerPaymentId;
    this.txid = payment.providerPaymentId;
    this.providerEndToEndId = payment.providerEndToEndId;
    this.pixCopyPaste = payment.pixCopyPaste;
    this.pixQrCode = payment.pixQrCode;
    this.pixQrCodeBase64 = payment.pixQrCode;
    this.pixExpiresAt = payment.pixExpiresAt;
    this.expiresAt = payment.pixExpiresAt;
    this.installments = payment.installments;
    this.cardBrand = payment.cardBrand;
    this.cardLastDigits = payment.cardLastDigits;
    this.payerName = payment.payerName;
    this.payerDocumentMasked = maskDocument(payment.payerDocument);
    this.payerBank = payment.payerBank;
    this.paidAt = payment.paidAt;
    this.failedReason = payment.failedReason;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}
