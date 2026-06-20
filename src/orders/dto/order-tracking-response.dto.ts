import { Order } from '@prisma/client';

export class OrderTrackingResponseDto {
  orderNumber: string;
  customerName: string | null;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(order: Order) {
    this.orderNumber = order.orderNumber;
    this.customerName = order.customerName;
    this.orderStatus = order.orderStatus;
    this.paymentStatus = order.paymentStatus;
    this.paymentMethod = order.paymentMethod;
    this.totalAmount = order.totalAmount.toString();
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}
