import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { paginate } from 'src/commom/utils/pagination.util';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { FilterPaymentsDto } from './dto/filter-payments.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { InterPixService } from './providers/inter/inter-pix.service';
import type { InterPixWebhookPayload } from './providers/inter/inter.types';
import { CreateManualPaymentDto } from './dto/create-manual-payment.dto';

type PaymentTx = Prisma.TransactionClient;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly interPixService: InterPixService,
  ) {}

  async findMany(
    query: FilterPaymentsDto,
  ): Promise<ApiResponse<PaymentResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const where: Prisma.PaymentWhereInput = {
        ...(query.orderId && {
          orderId: query.orderId,
        }),
        ...(query.status && {
          status: query.status as PaymentStatus,
        }),
        ...(query.paymentMethod && {
          paymentMethod: query.paymentMethod as PaymentMethod,
        }),
      };

      if (query.date) {
        const startDate = new Date(query.date);
        const endDate = new Date(query.date);

        if (!Number.isNaN(startDate.getTime())) {
          endDate.setDate(endDate.getDate() + 1);

          where.createdAt = {
            gte: startDate,
            lt: endDate,
          };
        }
      }

      const [payments, total] = await this.prisma.$transaction([
        this.prisma.payment.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.payment.count({
          where,
        }),
      ]);

      return {
        data: payments.map((payment) => new PaymentResponseDto(payment)),
        meta: meta(total),
      };
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível buscar os pagamentos.',
      );
    }
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: {
          id,
        },
      });

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado.');
      }

      return new PaymentResponseDto(payment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível buscar o pagamento.',
      );
    }
  }

  async findByOrder(orderId: string): Promise<PaymentResponseDto[]> {
    try {
      const order = await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      const payments = await this.prisma.payment.findMany({
        where: {
          orderId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return payments.map((payment) => new PaymentResponseDto(payment));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível buscar pagamentos do pedido.',
      );
    }
  }

  async createPixPayment(
    orderId: string,
    dto: CreatePixPaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      const order = await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      if (order.paymentMethod !== PaymentMethod.PIX) {
        throw new BadRequestException(
          'Este pedido não está configurado para pagamento via PIX.',
        );
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestException('Este pedido já está pago.');
      }

      const payment = order.payments[0];

      if (!payment) {
        throw new NotFoundException(
          'Pagamento pendente não encontrado para este pedido.',
        );
      }

      const expirationSeconds =
        dto.expirationSeconds ??
        Number(process.env.INTER_PIX_EXPIRATION_SECONDS ?? 900);

      const txid = this.generateTxid(order.orderNumber);

      const interCharge = await this.interPixService.createCharge({
        txid,
        amount: this.formatAmount(order.totalAmount),
        pixKey: this.getRequiredEnv('INTER_PIX_KEY'),
        expirationSeconds,
        payerName: order.customerName ?? undefined,
        description:
          dto.description ?? `Pedido ${order.orderNumber} - Se Liga no Açaí`,
      });

      const updatedPayment = await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          provider: 'INTER',
          providerPaymentId: interCharge.txid,
          pixCopyPaste: interCharge.pixCopyPaste,
          pixQrCode: interCharge.pixQrCodeBase64,
          pixExpiresAt: interCharge.pixExpiresAt,
          status: PaymentStatus.PENDING,
          pixStatusCheckAttempts: 0,
          pixStatusCheckFinished: false,
          nextPixStatusCheckAt: new Date(Date.now() + 30_000),
        },
      });

      return new PaymentResponseDto(updatedPayment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível criar a cobrança PIX.',
      );
    }
  }

  async syncPixPayment(paymentId: string): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado.');
      }

      if (payment.provider !== 'INTER' || !payment.providerPaymentId) {
        throw new BadRequestException(
          'Este pagamento não possui cobrança PIX Inter vinculada.',
        );
      }

      const interPayment = await this.interPixService.getCharge(
        payment.providerPaymentId,
      );

      if (!interPayment.isPaid) {
        return new PaymentResponseDto(payment);
      }

      const updatedPayment = await this.prisma.$transaction(async (tx) => {
        return this.markPaymentAsPaid(tx, {
          paymentId: payment.id,
          orderId: payment.orderId,
          paidAt: interPayment.paidAt ?? new Date(),
          endToEndId: interPayment.endToEndId,
          amountPaid: interPayment.amountPaid,
        });
      });

      return new PaymentResponseDto(updatedPayment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível sincronizar o pagamento PIX.',
      );
    }
  }

  async updateStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const currentPayment = await tx.payment.findUnique({
          where: {
            id,
          },
        });

        if (!currentPayment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        const paidAt =
          dto.paymentStatus === PaymentStatus.PAID
            ? (currentPayment.paidAt ?? new Date())
            : undefined;

        const updatedPayment = await tx.payment.update({
          where: {
            id,
          },
          data: {
            status: dto.paymentStatus,
            paidAt,
            failedReason:
              dto.paymentStatus === PaymentStatus.FAILED
                ? dto.reason
                : undefined,
          },
        });

        await tx.order.update({
          where: {
            id: currentPayment.orderId,
          },
          data: {
            paymentStatus: dto.paymentStatus,
            orderStatus: this.getNextOrderStatusByPayment(dto.paymentStatus),
          },
        });

        await this.loyaltyService.tryAddStampForOrder(
          tx,
          currentPayment.orderId,
        );

        return updatedPayment;
      });

      return new PaymentResponseDto(payment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar o status do pagamento.',
      );
    }
  }

  async handleInterWebhook(
    payload: InterPixWebhookPayload,
  ): Promise<{ received: boolean; processed: number }> {
    const pixItems = payload.pix ?? [];

    if (pixItems.length === 0) {
      return { received: true, processed: 0 };
    }

    let processed = 0;

    for (const pix of pixItems) {
      if (!pix.txid) {
        continue;
      }

      const payment = await this.prisma.payment.findFirst({
        where: { provider: 'INTER', providerPaymentId: pix.txid },
      });

      if (!payment) {
        continue;
      }

      if (payment.status === PaymentStatus.PAID) {
        continue;
      }

      const receivedAmount = pix.valor ? Number(pix.valor) : null;
      const expectedAmount = Number(payment.amount);

      if (
        receivedAmount !== null &&
        Number.isFinite(expectedAmount) &&
        Number.isFinite(receivedAmount) &&
        Math.abs(expectedAmount - receivedAmount) > 0.01
      ) {
        console.error(
          `[PIX Webhook] Valor divergente — esperado: ${expectedAmount}, recebido: ${receivedAmount}, txid: ${pix.txid}`,
        );
        continue;
      }

      const payerDocument = pix.pagador?.cpf ?? pix.pagador?.cnpj ?? null;

      await this.prisma.$transaction(async (tx) => {
        await this.markPaymentAsPaid(tx, {
          paymentId: payment.id,
          orderId: payment.orderId,
          paidAt: pix.horario ? new Date(pix.horario) : new Date(),
          endToEndId: pix.endToEndId ?? null,
          amountPaid: receivedAmount,
          payerName: pix.pagador?.nome ?? pix.infoPagador ?? null,
          payerDocument,
          payerBank: pix.pagador?.instituicao ?? null,
          webhookPayload: payload,
        });
      });

      processed += 1;
    }

    return { received: true, processed };
  }

  private async markPaymentAsPaid(
    tx: PaymentTx,
    params: {
      paymentId: string;
      orderId: string;
      paidAt: Date;
      endToEndId?: string | null;
      amountPaid?: number | null;
      payerName?: string | null;
      payerDocument?: string | null;
      payerBank?: string | null;
      webhookPayload?: unknown;
    },
  ) {
    const updatedPayment = await tx.payment.update({
      where: { id: params.paymentId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: params.paidAt,
        failedReason: null,
        pixStatusCheckFinished: true,
        lastPixStatusCheckedAt: new Date(),
        ...(params.endToEndId !== undefined && { providerEndToEndId: params.endToEndId }),
        ...(params.amountPaid !== null && params.amountPaid !== undefined && { amountPaid: params.amountPaid }),
        ...(params.payerName !== undefined && { payerName: params.payerName }),
        ...(params.payerDocument !== undefined && { payerDocument: params.payerDocument }),
        ...(params.payerBank !== undefined && { payerBank: params.payerBank }),
        ...(params.webhookPayload !== undefined && { webhookPayload: params.webhookPayload as any }),
      },
    });

    await tx.order.update({
      where: {
        id: params.orderId,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PAID,
      },
    });

    await this.loyaltyService.tryAddStampForOrder(tx, params.orderId);

    return updatedPayment;
  }

  private getNextOrderStatusByPayment(
    paymentStatus: PaymentStatus,
  ): OrderStatus | undefined {
    if (paymentStatus === PaymentStatus.PAID) {
      return OrderStatus.PAID;
    }

    if (
      paymentStatus === PaymentStatus.FAILED ||
      paymentStatus === PaymentStatus.CANCELED
    ) {
      return OrderStatus.AWAITING_PAYMENT;
    }

    return undefined;
  }

  private generateTxid(orderNumber: string): string {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const base = `SLACAI${orderNumber}${Date.now()}${random}`;

    return base.replace(/[^A-Za-z0-9]/g, '').slice(0, 35);
  }

  private formatAmount(value: Prisma.Decimal): string {
    return Number(value).toFixed(2);
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];

    if (!value) {
      throw new InternalServerErrorException(
        `Variável de ambiente ${key} não configurada.`,
      );
    }

    return value;
  }

  async findByOrderForCustomer(
    orderId: string,
    customerId: string,
  ): Promise<PaymentResponseDto[]> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, customerId },
        select: { id: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      const payments = await this.prisma.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });

      return payments.map((p) => new PaymentResponseDto(p));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Não foi possível buscar pagamentos do pedido.',
      );
    }
  }

  async createManualPayment(
    orderId: string,
    dto: CreateManualPaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id: orderId,
          },
          include: {
            payments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!order) {
          throw new NotFoundException('Pedido não encontrado.');
        }

        if (
          dto.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY &&
          dto.paymentMethod !== PaymentMethod.CARD_ON_DELIVERY
        ) {
          throw new BadRequestException(
            'Método manual permitido apenas para dinheiro ou cartão na entrega.',
          );
        }

        if (order.paymentStatus === PaymentStatus.PAID) {
          throw new BadRequestException('Este pedido já está pago.');
        }

        const currentPayment = order.payments[0];

        if (!currentPayment) {
          throw new NotFoundException(
            'Pagamento não encontrado para este pedido.',
          );
        }

        const updatedPayment = await tx.payment.update({
          where: {
            id: currentPayment.id,
          },
          data: {
            paymentMethod: dto.paymentMethod,
            status: PaymentStatus.PENDING,
            provider: 'MANUAL',
            providerPaymentId: null,
            pixQrCode: null,
            pixCopyPaste: null,
            pixExpiresAt: null,
            paidAt: null,
            failedReason: null,
          },
        });

        await tx.order.update({
          where: {
            id: orderId,
          },
          data: {
            paymentMethod: dto.paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        return updatedPayment;
      });

      return new PaymentResponseDto(payment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível configurar pagamento manual.',
      );
    }
  }
}
