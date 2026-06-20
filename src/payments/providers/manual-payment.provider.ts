import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import type {
  ConfirmPaymentProviderResult,
  CreatePaymentProviderParams,
  CreatePaymentProviderResult,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class ManualPaymentProvider implements PaymentProvider {
  async createPayment(
    params: CreatePaymentProviderParams,
  ): Promise<CreatePaymentProviderResult> {
    return {
      provider: 'MANUAL',
      providerPaymentId: null,
      status: PaymentStatus.PENDING,
      pixQrCode: null,
      pixCopyPaste: null,
      pixExpiresAt: null,
      installments: null,
      cardBrand: null,
      cardLastDigits: null,
    };
  }

  async getPaymentStatus(
    providerPaymentId: string,
  ): Promise<ConfirmPaymentProviderResult> {
    return {
      providerPaymentId,
      status: PaymentStatus.PENDING,
      paidAt: null,
      failedReason: null,
    };
  }

  confirmPayment(): ConfirmPaymentProviderResult {
    return {
      providerPaymentId: null,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      failedReason: null,
    };
  }

  failPayment(reason?: string): ConfirmPaymentProviderResult {
    return {
      providerPaymentId: null,
      status: PaymentStatus.FAILED,
      paidAt: null,
      failedReason: reason ?? 'Pagamento não aprovado.',
    };
  }

  cancelPayment(reason?: string): ConfirmPaymentProviderResult {
    return {
      providerPaymentId: null,
      status: PaymentStatus.CANCELED,
      paidAt: null,
      failedReason: reason ?? 'Pagamento cancelado.',
    };
  }
}
