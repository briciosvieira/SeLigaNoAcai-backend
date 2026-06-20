import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { paginate } from 'src/commom/utils/pagination.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { OrderTrackingResponseDto } from './dto/order-tracking-response.dto';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
import { InterPixService } from 'src/payments/providers/inter/inter-pix.service';
import { PaymentResponseDto } from 'src/payments/dto/payment-response.dto';
import {
  PICKUP_DELIVERY_ZONE_ID,
  PICKUP_DELIVERY_ZONE_NAME,
} from 'src/commom/constants/pickup.constants';

type OrderCustomer = {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  cpf: string | null;
};

export type CreateOrderResult = {
  order: OrderResponseDto;
  payment: PaymentResponseDto | null;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly interPixService: InterPixService,
  ) {}

  async findMany(
    query: FilterOrdersDto,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const where: Prisma.OrderWhereInput = {
        ...(query.orderStatus && {
          orderStatus: query.orderStatus as OrderStatus,
        }),
        ...(query.paymentStatus && {
          paymentStatus: query.paymentStatus as PaymentStatus,
        }),
      };

      const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.order.count({
          where,
        }),
      ]);

      return {
        data: orders.map((order) => new OrderResponseDto(order)),
        meta: meta(total),
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar pedidos.');
    }
  }

  async findOne(id: string): Promise<OrderDetailResponseDto> {
    try {
      const order = await this.prisma.order.findUnique({
        where: {
          id,
        },
        include: {
          customerAddress: true,
          deliveryZone: true,
          items: {
            include: {
              options: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      return new OrderDetailResponseDto(order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao buscar pedido.');
    }
  }

  async create(
    dto: CreateOrderDto,
    user?: CurrentUserPayload | null,
  ): Promise<CreateOrderResult> {
    try {
      const { createdOrder, paymentId, totalAmount, orderNumber } =
        await this.prisma.$transaction(async (tx) => {
        const store = await tx.store.findFirst({
          where: {
            isActive: true,
          },
        });

        if (!store) {
          throw new NotFoundException('Loja ativa não encontrada.');
        }

        const isPickup = dto.deliveryZoneId === PICKUP_DELIVERY_ZONE_ID;

        const deliveryZone = await tx.deliveryZone.findFirst({
          where: {
            id: dto.deliveryZoneId,
            storeId: store.id,
            isAvailable: true,
          },
        });

        if (!deliveryZone) {
          throw new NotFoundException(
            isPickup
              ? 'Opção de retirada na loja não disponível.'
              : 'Bairro de entrega não encontrado.',
          );
        }

        if (!isPickup) {
          if (!dto.address?.street || !dto.address?.number) {
            throw new BadRequestException(
              'Rua e número são obrigatórios para pedidos com entrega.',
            );
          }
        }

        if (!dto.items || dto.items.length === 0) {
          throw new BadRequestException(
            'O pedido deve conter pelo menos um item.',
          );
        }

        const orderNumber = await this.generateOrderNumber(tx);

        let customer: OrderCustomer;

        if (user) {
          const loggedCustomer = await tx.customer.findFirst({
            where: {
              id: user.id,
              isActive: true,
            },
          });

          if (!loggedCustomer) {
            throw new UnauthorizedException('Cliente autenticado inválido.');
          }

          customer = loggedCustomer;
        } else {
          customer = await tx.customer.create({
            data: {
              fullName: dto.customer.fullName,
              phone: dto.customer.phone,
              email: dto.customer.email?.toLowerCase(),
              cpf: dto.customer.cpf,
              authProvider: 'GUEST',
              isGuest: true,
              isActive: true,
            },
          });
        }

        const customerAddress = await tx.customerAddress.create({
          data: {
            customer: {
              connect: {
                id: customer.id,
              },
            },
            deliveryZone: {
              connect: {
                id: deliveryZone.id,
              },
            },
            street: isPickup ? null : (dto.address?.street ?? null),
            number: isPickup ? null : (dto.address?.number ?? null),
            complement: isPickup ? null : (dto.address?.complement ?? null),
            referencePoint: isPickup ? null : (dto.address?.referencePoint ?? null),
            neighborhood: isPickup ? PICKUP_DELIVERY_ZONE_NAME : deliveryZone.neighborhood,
            city: deliveryZone.city,
            state: deliveryZone.state,
            isDefault: true,
          },
        });

        let subtotalAmount = new Prisma.Decimal(0);

        const calculatedItems: {
          productId: string;
          productVariantId: string | null;
          productName: string;
          variantName: string | null;
          quantity: number;
          unitPrice: Prisma.Decimal;
          optionsAmount: Prisma.Decimal;
          totalAmount: Prisma.Decimal;
          itemDescription?: string;
          options: {
            optionGroupId: string;
            optionId: string;
            groupName: string;
            optionName: string;
            additionalPrice: Prisma.Decimal;
          }[];
        }[] = [];

        for (const item of dto.items) {
          const product = await tx.product.findFirst({
            where: {
              id: item.productId,
              storeId: store.id,
              isActive: true,
            },
          });

          if (!product) {
            throw new NotFoundException(
              `Produto não encontrado: ${item.productId}`,
            );
          }

          let unitPrice = product.basePrice;
          let variantName: string | null = null;
          let productVariantId: string | null = null;

          if (item.variantId) {
            const variant = await tx.productVariant.findFirst({
              where: {
                id: item.variantId,
                productId: product.id,
                isActive: true,
              },
            });

            if (!variant) {
              throw new NotFoundException(
                `Variação não encontrada para o produto: ${product.name}`,
              );
            }

            unitPrice = variant.price;
            variantName = variant.name;
            productVariantId = variant.id;
          }

          const optionIds = item.optionIds ?? [];
          const uniqueOptionIds = [...new Set(optionIds)];

          const selectedOptions = uniqueOptionIds.length
            ? await tx.option.findMany({
                where: {
                  id: {
                    in: uniqueOptionIds,
                  },
                  isActive: true,
                },
                include: {
                  optionGroup: true,
                },
              })
            : [];

          if (selectedOptions.length !== uniqueOptionIds.length) {
            throw new BadRequestException(
              `Uma ou mais opções do produto ${product.name} são inválidas.`,
            );
          }

          const optionsAmount = selectedOptions.reduce(
            (total, option) => total.plus(option.additionalPrice),
            new Prisma.Decimal(0),
          );

          const quantity = item.quantity;
          const totalAmount = unitPrice.plus(optionsAmount).mul(quantity);

          subtotalAmount = subtotalAmount.plus(totalAmount);

          calculatedItems.push({
            productId: product.id,
            productVariantId,
            productName: product.name,
            variantName,
            quantity,
            unitPrice,
            optionsAmount,
            totalAmount,
            itemDescription: item.notes,
            options: selectedOptions.map((option) => ({
              optionGroupId: option.optionGroupId,
              optionId: option.id,
              groupName: option.optionGroup.name,
              optionName: option.name,
              additionalPrice: option.additionalPrice,
            })),
          });
        }

        const deliveryFee = isPickup
          ? new Prisma.Decimal(0)
          : deliveryZone.deliveryFee;
        const discountAmount = new Prisma.Decimal(0);
        const totalAmount = subtotalAmount
          .plus(deliveryFee)
          .minus(discountAmount);

        const deliveryAddressText = isPickup
          ? PICKUP_DELIVERY_ZONE_NAME
          : this.buildDeliveryAddressText(dto);

        const whatsappMessage = this.buildWhatsappMessage({
          storeName: store.name,
          customerName: dto.customer.fullName,
          customerPhone: dto.customer.phone,
          deliveryNeighborhood: deliveryZone.neighborhood,
          deliveryAddressText,
          items: calculatedItems,
          subtotalAmount,
          deliveryFee,
          totalAmount,
          paymentMethod: dto.paymentMethod,
        });

        const createdOrder = await tx.order.create({
          data: {
            orderNumber,

            store: {
              connect: {
                id: store.id,
              },
            },

            customer: {
              connect: {
                id: customer.id,
              },
            },

            customerAddress: {
              connect: {
                id: customerAddress.id,
              },
            },

            deliveryZone: {
              connect: {
                id: deliveryZone.id,
              },
            },

            customerName: dto.customer.fullName,
            customerPhone: dto.customer.phone,
            customerEmail: dto.customer.email?.toLowerCase(),

            deliveryNeighborhood: isPickup
              ? PICKUP_DELIVERY_ZONE_NAME
              : deliveryZone.neighborhood,
            deliveryAddressText,

            subtotalAmount,
            deliveryFee,
            discountAmount,
            totalAmount,

            paymentMethod: dto.paymentMethod,
            paymentStatus: 'PENDING',
            orderStatus: 'CREATED',

            changeForAmount: dto.changeForAmount,
            notes: dto.notes,
            whatsappMessage,
            source: 'SITE',
          },
        });

        for (const item of calculatedItems) {
          const orderItem = await tx.orderItem.create({
            data: {
              order: {
                connect: {
                  id: createdOrder.id,
                },
              },

              product: {
                connect: {
                  id: item.productId,
                },
              },

              ...(item.productVariantId && {
                productVariant: {
                  connect: {
                    id: item.productVariantId,
                  },
                },
              }),

              productName: item.productName,
              variantName: item.variantName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              optionsAmount: item.optionsAmount,
              totalAmount: item.totalAmount,
              itemDescription: item.itemDescription,
            },
          });

          for (const option of item.options) {
            await tx.orderItemOption.create({
              data: {
                orderItem: {
                  connect: {
                    id: orderItem.id,
                  },
                },

                optionGroup: {
                  connect: {
                    id: option.optionGroupId,
                  },
                },

                option: {
                  connect: {
                    id: option.optionId,
                  },
                },

                groupName: option.groupName,
                optionName: option.optionName,
                additionalPrice: option.additionalPrice,
              },
            });
          }
        }

        const stubPayment = await tx.payment.create({
          data: {
            order: {
              connect: {
                id: createdOrder.id,
              },
            },
            paymentMethod: dto.paymentMethod,
            status: 'PENDING',
            amount: totalAmount,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            order: {
              connect: {
                id: createdOrder.id,
              },
            },
            oldStatus: null,
            newStatus: 'CREATED',
            description: 'Pedido criado pelo checkout.',
            createdBy: 'system',
          },
        });

        return {
          createdOrder,
          paymentId: stubPayment.id,
          totalAmount,
          orderNumber,
        };
      });

      if (dto.paymentMethod === PaymentMethod.PIX) {
        const expirationSeconds = Number(
          process.env.INTER_PIX_EXPIRATION_SECONDS ?? 900,
        );
        const pixKey = process.env.INTER_PIX_KEY;

        if (!pixKey) {
          throw new InternalServerErrorException(
            'Chave PIX não configurada no servidor.',
          );
        }

        const payerName = dto.customer.fullName || 'Cliente';
        const txid = this.buildPixTxid(orderNumber);

        console.log('[PIX] ▶ Iniciando geração', {
          orderNumber,
          txid,
          amount: Number(totalAmount).toFixed(2),
          payerName,
          pixKey: pixKey.slice(0, 6) + '***',
          expirationSeconds,
        });

        const interCharge = await this.interPixService.createCharge({
          txid,
          amount: Number(totalAmount).toFixed(2),
          pixKey,
          expirationSeconds,
          payerName,
          description: `Pedido ${orderNumber} - Se Liga no Açaí`,
        });

        console.log('[PIX] ✔ Resposta do Inter', {
          txid: interCharge.txid,
          status: interCharge.status,
          pixCopyPaste: interCharge.pixCopyPaste ?? 'AUSENTE',
          pixQrCodeBase64: interCharge.pixQrCodeBase64
            ? `[OK - ${interCharge.pixQrCodeBase64.length} chars]`
            : 'AUSENTE',
          pixExpiresAt: interCharge.pixExpiresAt,
        });

        if (!interCharge.pixCopyPaste) {
          throw new InternalServerErrorException(
            'Não foi possível gerar o código PIX.',
          );
        }

        const updatedPayment = await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            provider: 'INTER',
            providerPaymentId: interCharge.txid,
            pixCopyPaste: interCharge.pixCopyPaste,
            pixQrCode: interCharge.pixQrCodeBase64,
            pixExpiresAt: interCharge.pixExpiresAt,
            status: 'PENDING',
          },
        });

        const paymentDto = new PaymentResponseDto(updatedPayment);

        console.log('[PIX] ✔ Resposta enviada ao frontend', {
          paymentId: paymentDto.id,
          pixCopyPaste: paymentDto.pixCopyPaste ?? 'AUSENTE',
          pixQrCodeBase64: paymentDto.pixQrCodeBase64
            ? `[OK - ${paymentDto.pixQrCodeBase64.length} chars]`
            : 'AUSENTE',
          expiresAt: paymentDto.expiresAt,
        });

        return {
          order: new OrderResponseDto(createdOrder),
          payment: paymentDto,
        };
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      return {
        order: new OrderResponseDto(createdOrder),
        payment: payment ? new PaymentResponseDto(payment) : null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Erro ao criar pedido:', error);

      throw new InternalServerErrorException(
        'Não foi possível criar o pedido.',
      );
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: {
            id,
          },
        });

        if (!currentOrder) {
          throw new NotFoundException('Pedido não encontrado.');
        }

        const updatedOrder = await tx.order.update({
          where: {
            id,
          },
          data: {
            orderStatus: dto.orderStatus,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            order: {
              connect: {
                id,
              },
            },
            oldStatus: currentOrder.orderStatus,
            newStatus: dto.orderStatus,
            description: dto.reason,
            createdBy: 'admin',
          },
        });

        await this.loyaltyService.tryAddStampForOrder(tx, id);

        return updatedOrder;
      });

      return new OrderResponseDto(order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar o status do pedido.',
      );
    }
  }

  private buildPixTxid(orderNumber: string): string {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const base = `SLACAI${orderNumber}${Date.now()}${random}`;

    return base.replace(/[^A-Za-z0-9]/g, '').slice(0, 35);
  }

  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const result = await tx.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('order_number_seq')::bigint AS nextval
    `;

    const nextValue = Number(result[0].nextval);

    return `PED-${String(nextValue).padStart(6, '0')}`;
  }

  private buildDeliveryAddressText(dto: CreateOrderDto): string {
    const address = dto.address;

    const street = address?.street ?? '';
    const number = address?.number ?? '';
    const complement = address?.complement ? ` - ${address.complement}` : '';
    const reference = address?.referencePoint
      ? ` | Referência: ${address.referencePoint}`
      : '';

    return `${street}, ${number}${complement}${reference}`;
  }

  private buildWhatsappMessage(params: {
    storeName: string;
    customerName: string;
    customerPhone: string;
    deliveryNeighborhood: string;
    deliveryAddressText: string;
    items: {
      productName: string;
      variantName: string | null;
      quantity: number;
      options: {
        optionName: string;
      }[];
    }[];
    subtotalAmount: Prisma.Decimal;
    deliveryFee: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    paymentMethod: string;
  }): string {
    const itemsText = params.items
      .map((item, index) => {
        const variant = item.variantName ? ` ${item.variantName}` : '';

        const options = item.options.length
          ? `\n   → ${item.options
              .map((option) => option.optionName)
              .join(' · ')}`
          : '';

        return `${index + 1}. ${item.quantity}x ${item.productName}${variant}${options}`;
      })
      .join('\n');

    return [
      `*Novo Pedido - ${params.storeName}*`,
      '',
      `Cliente: ${params.customerName}`,
      `Telefone: ${params.customerPhone}`,
      `Bairro: ${params.deliveryNeighborhood}`,
      '',
      `Endereço: ${params.deliveryAddressText}`,
      '',
      '*Itens:*',
      itemsText,
      '',
      `*Subtotal:* R$ ${params.subtotalAmount.toString()}`,
      `*Frete:* R$ ${params.deliveryFee.toString()}`,
      `*Total:* R$ ${params.totalAmount.toString()}`,
      `*Pagamento:* ${params.paymentMethod}`,
    ].join('\n');
  }

  async updatePaymentStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: {
            id,
          },
        });

        if (!currentOrder) {
          throw new NotFoundException('Pedido não encontrado.');
        }

        const nextOrderStatus =
          dto.paymentStatus === PaymentStatus.PAID
            ? OrderStatus.PAID
            : dto.paymentStatus === PaymentStatus.CANCELED ||
                dto.paymentStatus === PaymentStatus.REFUNDED
              ? OrderStatus.CANCELED
              : currentOrder.orderStatus;

        const updatedOrder = await tx.order.update({
          where: {
            id,
          },
          data: {
            paymentStatus: dto.paymentStatus,
            orderStatus: nextOrderStatus,
          },
        });

        await tx.payment.updateMany({
          where: {
            orderId: id,
          },
          data: {
            status: dto.paymentStatus,
            paidAt:
              dto.paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
            failedReason:
              dto.paymentStatus === PaymentStatus.FAILED
                ? dto.reason
                : undefined,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            order: {
              connect: {
                id,
              },
            },
            oldStatus: currentOrder.orderStatus,
            newStatus: nextOrderStatus,
            description:
              dto.reason ??
              `Status do pagamento alterado para ${dto.paymentStatus}.`,
            createdBy: 'admin',
          },
        });

        await this.loyaltyService.tryAddStampForOrder(tx, id);

        return updatedOrder;
      });

      return new OrderResponseDto(order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar o status do pagamento.',
      );
    }
  }

  async findMyOrders(
    customerId: string,
    query: FilterOrdersDto,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const where: Prisma.OrderWhereInput = {
        customerId,
        ...(query.orderStatus && {
          orderStatus: query.orderStatus as OrderStatus,
        }),
        ...(query.paymentStatus && {
          paymentStatus: query.paymentStatus as PaymentStatus,
        }),
      };

      const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.order.count({
          where,
        }),
      ]);

      return {
        data: orders.map((order) => new OrderResponseDto(order)),
        meta: meta(total),
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar seus pedidos.');
    }
  }

  async findMyOrder(
    customerId: string,
    id: string,
  ): Promise<OrderDetailResponseDto> {
    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id,
          customerId,
        },
        include: {
          customerAddress: true,
          deliveryZone: true,
          items: {
            include: {
              options: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      return new OrderDetailResponseDto(order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao buscar o pedido.');
    }
  }

  async trackOrder(
    orderNumber: string,
    phone: string,
  ): Promise<OrderTrackingResponseDto> {
    try {
      const normalizedOrderNumber = orderNumber.trim().toUpperCase();
      const normalizedPhone = this.normalizePhone(phone);

      const order = await this.prisma.order.findFirst({
        where: {
          orderNumber: normalizedOrderNumber,
          customerPhone: normalizedPhone,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      return new OrderTrackingResponseDto(order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar pedido.');
    }
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
