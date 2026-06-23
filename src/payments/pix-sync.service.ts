import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Payment, PaymentMethod, PaymentStatus } from '@prisma/client';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { InterPixService } from './providers/inter/inter-pix.service';

const CHECK_OFFSETS_SECONDS = [30, 90, 150, 210, 320];

export type SyncItemResult = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  txid: string;
  previousStatus: string;
  currentStatus: string;
  message: string;
};

export type SyncBatchResult = {
  success: boolean;
  checked: number;
  paid: number;
  stillPending: number;
  failed: number;
  items: SyncItemResult[];
};

export type SyncSingleResult = {
  paymentId: string;
  orderId: string;
  txid: string | null;
  previousStatus: string;
  currentStatus: string;
  payment: PaymentResponseDto;
  message: string;
};

@Injectable()
export class PixSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interPixService: InterPixService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  // Chamado pelo cron job a cada 30s
  async processScheduledChecks(): Promise<void> {
    const duePayments = await this.prisma.payment.findMany({
      where: {
        provider: 'INTER',
        paymentMethod: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        pixStatusCheckFinished: false,
        providerPaymentId: { not: null },
        nextPixStatusCheckAt: { lte: new Date() },
      },
      take: 20,
    });

    for (const payment of duePayments) {
      try {
        await this.checkAndUpdatePayment(payment);
      } catch (err) {
        console.error(
          `[INTER PIX SYNC] Erro inesperado no payment ${payment.id}:`,
          err instanceof Error ? err.message : 'Erro desconhecido',
        );
      }
    }
  }

  // Chamado pelo endpoint admin: últimas N horas
  async syncRecentPendingPayments(hours: number): Promise<SyncBatchResult> {
    const since = new Date(Date.now() - hours * 60 * 60_000);

    const payments = await this.prisma.payment.findMany({
      where: {
        provider: 'INTER',
        paymentMethod: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        providerPaymentId: { not: null },
        createdAt: { gte: since },
      },
      include: { order: { select: { orderNumber: true } } },
      take: 50,
    });

    const result: SyncBatchResult = {
      success: true,
      checked: payments.length,
      paid: 0,
      stillPending: 0,
      failed: 0,
      items: [],
    };

    for (const p of payments) {
      const outcome = await this.checkAndUpdatePayment(p);
      const item: SyncItemResult = {
        paymentId: p.id,
        orderId: p.orderId,
        orderNumber: (p as any).order?.orderNumber ?? '',
        txid: p.providerPaymentId ?? '',
        previousStatus: 'PENDING',
        currentStatus: outcome === 'PAID' ? 'PAID' : 'PENDING',
        message:
          outcome === 'PAID'
            ? 'Pagamento confirmado no Inter.'
            : outcome === 'ERROR'
              ? 'Falha ao consultar o Inter.'
              : 'Pagamento ainda pendente.',
      };

      result.items.push(item);

      if (outcome === 'PAID') result.paid++;
      else if (outcome === 'ERROR') result.failed++;
      else result.stillPending++;
    }

    return result;
  }

  // Chamado pelo admin ou cliente para um pagamento específico
  async syncPayment(paymentId: string): Promise<SyncSingleResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado.');
    }

    if (
      payment.provider !== 'INTER' ||
      payment.paymentMethod !== PaymentMethod.PIX
    ) {
      throw new BadRequestException(
        'Este pagamento não é um PIX Inter.',
      );
    }

    if (!payment.providerPaymentId) {
      throw new BadRequestException(
        'Este pagamento não possui txid vinculado.',
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        txid: payment.providerPaymentId,
        previousStatus: 'PAID',
        currentStatus: 'PAID',
        payment: new PaymentResponseDto(payment),
        message: 'Pagamento já está confirmado.',
      };
    }

    const outcome = await this.checkAndUpdatePayment(payment);
    const updated = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      txid: payment.providerPaymentId,
      previousStatus: 'PENDING',
      currentStatus: updated!.status,
      payment: new PaymentResponseDto(updated!),
      message:
        outcome === 'PAID'
          ? 'Pagamento confirmado no Inter.'
          : outcome === 'ERROR'
            ? 'Falha ao consultar o Inter.'
            : 'Pagamento ainda pendente.',
    };
  }

  // Chamado pelo endpoint do cliente (próprio pedido, rate-limited)
  async syncOrderPixForCustomer(
    orderId: string,
    customerId: string,
  ): Promise<SyncSingleResult> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        provider: 'INTER',
        paymentMethod: PaymentMethod.PIX,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento PIX não encontrado para este pedido.',
      );
    }

    if (payment.lastPixStatusCheckedAt) {
      const diffMs = Date.now() - payment.lastPixStatusCheckedAt.getTime();

      if (diffMs < 15_000) {
        throw new HttpException(
          'Aguarde 15 segundos antes de consultar novamente.',
          429,
        );
      }
    }

    return this.syncPayment(payment.id);
  }

  private async checkAndUpdatePayment(
    payment: Payment,
  ): Promise<'PAID' | 'PENDING' | 'ERROR'> {
    const txid = payment.providerPaymentId!;
    const now = new Date();

    console.log(
      `[INTER PIX SYNC] Checking payment { paymentId: ${payment.id}, orderId: ${payment.orderId}, txid: ${txid} }`,
    );

    try {
      const charge = await this.interPixService.getCharge(txid);

      if (charge.isPaid) {
        await this.markPaid(payment, {
          paidAt: charge.paidAt ?? now,
          endToEndId: charge.endToEndId,
          amountPaid: charge.amountPaid,
          payerName: charge.payerName,
          payerDocument: charge.payerDocument,
          payerBank: charge.payerBank,
        });

        console.log(
          `[INTER PIX SYNC] Payment confirmed { paymentId: ${payment.id}, orderId: ${payment.orderId} }`,
        );

        return 'PAID';
      }

      await this.scheduleNextAttempt(payment, now);
      console.log(
        `[INTER PIX SYNC] Still pending { paymentId: ${payment.id}, orderId: ${payment.orderId} }`,
      );

      return 'PENDING';
    } catch {
      // Fallback: buscar nos Pix recebidos da última hora
      try {
        const start = new Date(payment.createdAt.getTime() - 60_000);
        const receivedPix = await this.interPixService.listReceivedPix({
          start,
          end: now,
          txid,
        });

        const matching = receivedPix.find((p) => p.txid === txid);

        if (matching) {
          await this.markPaid(payment, {
            paidAt: matching.horario ? new Date(matching.horario) : now,
            endToEndId: matching.endToEndId ?? null,
            amountPaid: matching.valor ? Number(matching.valor) : null,
            payerName:
              matching.pagador?.nome ?? matching.infoPagador ?? null,
            payerDocument:
              matching.pagador?.cpf ?? matching.pagador?.cnpj ?? null,
            payerBank: matching.pagador?.instituicao ?? null,
          });

          console.log(
            `[INTER PIX SYNC] Payment confirmed via fallback { paymentId: ${payment.id}, orderId: ${payment.orderId} }`,
          );

          return 'PAID';
        }

        await this.scheduleNextAttempt(payment, now);

        return 'PENDING';
      } catch (fallbackErr) {
        console.error(
          `[INTER PIX SYNC] Failed { paymentId: ${payment.id}, orderId: ${payment.orderId}, errorMessage: ${fallbackErr instanceof Error ? fallbackErr.message : 'Erro desconhecido'} }`,
        );

        await this.scheduleNextAttempt(payment, now).catch(() => null);

        return 'ERROR';
      }
    }
  }

  private async markPaid(
    payment: Payment,
    data: {
      paidAt: Date;
      endToEndId: string | null;
      amountPaid: number | null;
      payerName: string | null;
      payerDocument: string | null;
      payerBank: string | null;
    },
  ): Promise<void> {
    const expectedAmount = Number(payment.amount);

    if (
      data.amountPaid !== null &&
      Number.isFinite(expectedAmount) &&
      Number.isFinite(data.amountPaid) &&
      Math.abs(expectedAmount - data.amountPaid) > 0.01
    ) {
      console.error(
        `[INTER PIX SYNC] Valor divergente — esperado: ${expectedAmount}, recebido: ${data.amountPaid}, txid: ${payment.providerPaymentId}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: data.paidAt,
          failedReason: null,
          pixStatusCheckFinished: true,
          lastPixStatusCheckedAt: new Date(),
          ...(data.endToEndId !== null && {
            providerEndToEndId: data.endToEndId,
          }),
          ...(data.amountPaid !== null && { amountPaid: data.amountPaid }),
          ...(data.payerName !== null && { payerName: data.payerName }),
          ...(data.payerDocument !== null && {
            payerDocument: data.payerDocument,
          }),
          ...(data.payerBank !== null && { payerBank: data.payerBank }),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.PAID,
        },
      });

      await this.loyaltyService.tryAddStampForOrder(tx, payment.orderId);
    });
  }

  private async scheduleNextAttempt(
    payment: Payment,
    now: Date = new Date(),
  ): Promise<void> {
    const attempts = (payment.pixStatusCheckAttempts ?? 0) + 1;
    const nextOffsetSecs = CHECK_OFFSETS_SECONDS[attempts];

    if (!nextOffsetSecs) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          pixStatusCheckAttempts: attempts,
          lastPixStatusCheckedAt: now,
          nextPixStatusCheckAt: null,
          pixStatusCheckFinished: true,
        },
      });

      return;
    }

    const nextPixStatusCheckAt = new Date(
      payment.createdAt.getTime() + nextOffsetSecs * 1_000,
    );

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        pixStatusCheckAttempts: attempts,
        lastPixStatusCheckedAt: now,
        nextPixStatusCheckAt,
      },
    });
  }
}
