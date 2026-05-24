import { Prisma } from '@prisma/client';
import { OrderItemResponseDto } from './order-item-response.dto';
import { PaymentResponseDto } from './order-payment-response.dto';
import { OrderStatusHistoryResponseDto } from './order-status-history-response.dto';

type OrderDetail = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        options: true;
      };
    };
    payments: true;
    statusHistory: true;
    customerAddress: true;
    deliveryZone: true;
  };
}>;

export class OrderDetailResponseDto {
  id: string;
  orderNumber: string;

  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;

  deliveryNeighborhood: string | null;
  deliveryAddressText: string | null;

  subtotalAmount: string;
  deliveryFee: string;
  discountAmount: string;
  totalAmount: string;

  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;

  changeForAmount: string | null;
  notes: string | null;
  whatsappMessage: string | null;

  createdAt: Date;
  updatedAt: Date;

  address: {
    id: string;
    street: string | null;
    number: string | null;
    complement: string | null;
    referencePoint: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;

  deliveryZone: {
    id: string;
    neighborhood: string;
    city: string;
    state: string;
    deliveryFee: string;
  } | null;

  items: OrderItemResponseDto[];
  payments: PaymentResponseDto[];
  statusHistory: OrderStatusHistoryResponseDto[];

  constructor(order: OrderDetail) {
    this.id = order.id;
    this.orderNumber = order.orderNumber;

    this.customerName = order.customerName;
    this.customerPhone = order.customerPhone;
    this.customerEmail = order.customerEmail;

    this.deliveryNeighborhood = order.deliveryNeighborhood;
    this.deliveryAddressText = order.deliveryAddressText;

    this.subtotalAmount = order.subtotalAmount.toString();
    this.deliveryFee = order.deliveryFee.toString();
    this.discountAmount = order.discountAmount.toString();
    this.totalAmount = order.totalAmount.toString();

    this.paymentMethod = order.paymentMethod;
    this.paymentStatus = order.paymentStatus;
    this.orderStatus = order.orderStatus;

    this.changeForAmount = order.changeForAmount
      ? order.changeForAmount.toString()
      : null;

    this.notes = order.notes;
    this.whatsappMessage = order.whatsappMessage;

    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;

    this.address = order.customerAddress
      ? {
          id: order.customerAddress.id,
          street: order.customerAddress.street,
          number: order.customerAddress.number,
          complement: order.customerAddress.complement,
          referencePoint: order.customerAddress.referencePoint,
          neighborhood: order.customerAddress.neighborhood,
          city: order.customerAddress.city,
          state: order.customerAddress.state,
        }
      : null;

    this.deliveryZone = order.deliveryZone
      ? {
          id: order.deliveryZone.id,
          neighborhood: order.deliveryZone.neighborhood,
          city: order.deliveryZone.city,
          state: order.deliveryZone.state,
          deliveryFee: order.deliveryZone.deliveryFee.toString(),
        }
      : null;

    this.items = order.items.map((item) => new OrderItemResponseDto(item));

    this.payments = order.payments.map(
      (payment) => new PaymentResponseDto(payment),
    );

    this.statusHistory = order.statusHistory.map(
      (history) => new OrderStatusHistoryResponseDto(history),
    );
  }
}
