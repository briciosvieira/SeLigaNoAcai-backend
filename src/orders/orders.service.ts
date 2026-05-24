import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { paginate } from 'src/commom/utils/pagination.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const store = await tx.store.findFirst({
          where: {
            isActive: true,
          },
        });

        if (!store) {
          throw new NotFoundException('Loja ativa não encontrada.');
        }

        const deliveryZone = await tx.deliveryZone.findFirst({
          where: {
            id: dto.deliveryZoneId,
            storeId: store.id,
            isAvailable: true,
          },
        });

        if (!deliveryZone) {
          throw new NotFoundException('Bairro de entrega não encontrado.');
        }

        if (!dto.items || dto.items.length === 0) {
          throw new BadRequestException(
            'O pedido deve conter pelo menos um item.',
          );
        }

        const orderNumber = await this.generateOrderNumber(tx);

        const customer = await tx.customer.create({
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
            street: dto.address.street,
            number: dto.address.number,
            complement: dto.address.complement,
            referencePoint: dto.address.referencePoint,
            neighborhood: deliveryZone.neighborhood,
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

        if (subtotalAmount.lessThan(store.minimumOrderAmount)) {
          throw new BadRequestException(
            `Pedido mínimo de R$ ${store.minimumOrderAmount.toString()} não atingido.`,
          );
        }

        const deliveryFee = deliveryZone.deliveryFee;
        const discountAmount = new Prisma.Decimal(0);
        const totalAmount = subtotalAmount
          .plus(deliveryFee)
          .minus(discountAmount);

        const deliveryAddressText = this.buildDeliveryAddressText(dto);

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

            deliveryNeighborhood: deliveryZone.neighborhood,
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

        await tx.payment.create({
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

        return createdOrder;
      });

      return new OrderResponseDto(order);
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

    const complement = address.complement ? ` - ${address.complement}` : '';

    const reference = address.referencePoint
      ? ` | Referência: ${address.referencePoint}`
      : '';

    return `${address.street}, ${address.number}${complement}${reference}`;
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
}
