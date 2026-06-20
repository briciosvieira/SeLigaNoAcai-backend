import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  AuthProvider,
  LoyaltyCardStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

type DateRange = {
  gte: Date;
  lt: Date;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: DashboardFilterDto) {
    try {
      const dateRange = this.getDateRange(query);

      const [
        totalOrders,
        pendingOrders,
        paidOrders,
        deliveredOrders,
        canceledOrders,
        paidRevenue,
        totalCustomers,
        pendingPayments,
        availableRewards,
      ] = await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: dateRange,
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: dateRange,
            orderStatus: {
              in: [OrderStatus.CREATED, OrderStatus.AWAITING_PAYMENT],
            },
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: dateRange,
            paymentStatus: PaymentStatus.PAID,
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: dateRange,
            orderStatus: OrderStatus.DELIVERED,
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: dateRange,
            orderStatus: OrderStatus.CANCELED,
          },
        }),

        this.prisma.order.aggregate({
          where: {
            createdAt: dateRange,
            paymentStatus: PaymentStatus.PAID,
          },
          _sum: {
            totalAmount: true,
          },
        }),

        this.prisma.customer.count({
          where: {
            isGuest: false,
          },
        }),

        this.prisma.payment.count({
          where: {
            createdAt: dateRange,
            status: PaymentStatus.PENDING,
          },
        }),

        this.prisma.customerLoyaltyCard.count({
          where: {
            status: LoyaltyCardStatus.REWARD_AVAILABLE,
          },
        }),
      ]);

      return {
        totalOrders,
        pendingOrders,
        paidOrders,
        deliveredOrders,
        canceledOrders,
        paidRevenue: this.decimalToString(paidRevenue._sum.totalAmount),
        totalCustomers,
        pendingPayments,
        availableRewards,
      };
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar o resumo do dashboard.',
      );
    }
  }

  async orders(query: DashboardFilterDto) {
    try {
      const dateRange = this.getDateRange(query);

      const result = await this.prisma.order.groupBy({
        by: ['orderStatus'],
        where: {
          createdAt: dateRange,
        },
        _count: {
          _all: true,
        },
      });

      return Object.values(OrderStatus).map((status) => {
        const found = result.find((item) => item.orderStatus === status);

        return {
          status,
          total: found?._count._all ?? 0,
        };
      });
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar o resumo de pedidos.',
      );
    }
  }

  async revenue(query: DashboardFilterDto) {
    try {
      const dateRange = this.getDateRange(query);

      const [grossRevenue, paidRevenue, paidOrdersCount] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            createdAt: dateRange,
          },
          _sum: {
            totalAmount: true,
          },
        }),

        this.prisma.order.aggregate({
          where: {
            createdAt: dateRange,
            paymentStatus: PaymentStatus.PAID,
          },
          _sum: {
            totalAmount: true,
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: dateRange,
            paymentStatus: PaymentStatus.PAID,
          },
        }),
      ]);

      const paidRevenueNumber = Number(paidRevenue._sum.totalAmount ?? 0);
      const averageTicket =
        paidOrdersCount > 0 ? paidRevenueNumber / paidOrdersCount : 0;

      return {
        grossRevenue: this.decimalToString(grossRevenue._sum.totalAmount),
        paidRevenue: this.decimalToString(paidRevenue._sum.totalAmount),
        paidOrdersCount,
        averageTicket: averageTicket.toFixed(2),
      };
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar o resumo financeiro.',
      );
    }
  }

  async payments(query: DashboardFilterDto) {
    try {
      const dateRange = this.getDateRange(query);

      const byMethod = await this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          createdAt: dateRange,
        },
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      });

      const byStatus = await this.prisma.payment.groupBy({
        by: ['status'],
        where: {
          createdAt: dateRange,
        },
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      });

      return {
        byMethod: Object.values(PaymentMethod).map((method) => {
          const found = byMethod.find((item) => item.paymentMethod === method);

          return {
            method,
            total: found?._count._all ?? 0,
            amount: this.decimalToString(found?._sum.amount),
          };
        }),

        byStatus: Object.values(PaymentStatus).map((status) => {
          const found = byStatus.find((item) => item.status === status);

          return {
            status,
            total: found?._count._all ?? 0,
            amount: this.decimalToString(found?._sum.amount),
          };
        }),
      };
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar o resumo de pagamentos.',
      );
    }
  }

  async customers(query: DashboardFilterDto) {
    try {
      const dateRange = this.getDateRange(query);

      const [
        totalCustomers,
        registeredCustomers,
        guestCustomers,
        activeCustomers,
        manualCustomers,
        googleCustomers,
        newCustomers,
      ] = await Promise.all([
        this.prisma.customer.count(),

        this.prisma.customer.count({
          where: {
            isGuest: false,
          },
        }),

        this.prisma.customer.count({
          where: {
            isGuest: true,
          },
        }),

        this.prisma.customer.count({
          where: {
            isActive: true,
          },
        }),

        this.prisma.customer.count({
          where: {
            authProvider: AuthProvider.MANUAL,
          },
        }),

        this.prisma.customer.count({
          where: {
            authProvider: AuthProvider.GOOGLE,
          },
        }),

        this.prisma.customer.count({
          where: {
            createdAt: dateRange,
            isGuest: false,
          },
        }),
      ]);

      return {
        totalCustomers,
        registeredCustomers,
        guestCustomers,
        activeCustomers,
        manualCustomers,
        googleCustomers,
        newCustomers,
      };
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar o resumo de clientes.',
      );
    }
  }

  async loyalty() {
    try {
      const [
        activeCards,
        rewardAvailableCards,
        redeemedCards,
        expiredCards,
        canceledCards,
      ] = await Promise.all([
        this.prisma.customerLoyaltyCard.count({
          where: {
            status: LoyaltyCardStatus.ACTIVE,
          },
        }),

        this.prisma.customerLoyaltyCard.count({
          where: {
            status: LoyaltyCardStatus.REWARD_AVAILABLE,
          },
        }),

        this.prisma.customerLoyaltyCard.count({
          where: {
            status: LoyaltyCardStatus.REDEEMED,
          },
        }),

        this.prisma.customerLoyaltyCard.count({
          where: {
            status: LoyaltyCardStatus.EXPIRED,
          },
        }),

        this.prisma.customerLoyaltyCard.count({
          where: {
            status: LoyaltyCardStatus.CANCELED,
          },
        }),
      ]);

      return {
        activeCards,
        rewardAvailableCards,
        redeemedCards,
        expiredCards,
        canceledCards,
      };
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar o resumo de fidelidade.',
      );
    }
  }

  private getDateRange(query: DashboardFilterDto): DateRange {
    const now = new Date();

    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return {
      gte: startDate,
      lt: endDate,
    };
  }

  private decimalToString(value: Prisma.Decimal | null | undefined): string {
    return value ? value.toString() : '0';
  }

  async pendingOrders(query: DashboardFilterDto) {
    try {
      const dateRange = this.getDateRange(query);

      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: dateRange,
          orderStatus: {
            in: [
              OrderStatus.CREATED,
              OrderStatus.AWAITING_PAYMENT,
              OrderStatus.PAID,
              OrderStatus.PREPARING,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
        include: {
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
              updatedAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,

        customerName: order.customerName,
        customerPhone: order.customerPhone,

        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,

        deliveryNeighborhood: order.deliveryNeighborhood,
        deliveryAddressText: order.deliveryAddressText,

        notes: order.notes,

        subtotalAmount: order.subtotalAmount.toString(),
        deliveryFee: order.deliveryFee.toString(),
        discountAmount: order.discountAmount.toString(),
        totalAmount: order.totalAmount.toString(),

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        payment: order.payments[0]
          ? {
              id: order.payments[0].id,
              status: order.payments[0].status,
              provider: order.payments[0].provider,
              paidAt: order.payments[0].paidAt,
            }
          : null,

        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          optionsAmount: item.optionsAmount.toString(),
          totalAmount: item.totalAmount.toString(),
          itemDescription: item.itemDescription,

          options: item.options.map((option) => ({
            id: option.id,
            groupName: option.groupName,
            optionName: option.optionName,
            additionalPrice: option.additionalPrice.toString(),
          })),
        })),
      }));
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível carregar a fila de pedidos pendentes.',
      );
    }
  }
}
