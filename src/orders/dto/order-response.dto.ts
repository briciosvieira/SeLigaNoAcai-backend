import { Order } from '@prisma/client';

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalAmount: string;
  deliveryFee: string;
  discountAmount: string;
  totalAmount: string;
  notes: string | null;
  whatsappMessage: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(order: Order) {
    this.id = order.id;
    this.orderNumber = order.orderNumber;
    this.customerName = order.customerName;
    this.customerPhone = order.customerPhone;
    this.customerEmail = order.customerEmail;
    this.orderStatus = order.orderStatus;
    this.paymentMethod = order.paymentMethod;
    this.paymentStatus = order.paymentStatus;
    this.subtotalAmount = order.subtotalAmount.toString();
    this.deliveryFee = order.deliveryFee.toString();
    this.discountAmount = order.discountAmount.toString();
    this.totalAmount = order.totalAmount.toString();
    this.notes = order.notes;
    this.whatsappMessage = order.whatsappMessage;
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}
