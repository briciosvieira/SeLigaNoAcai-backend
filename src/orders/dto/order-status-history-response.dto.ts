import { OrderStatusHistory } from '@prisma/client';

export class OrderStatusHistoryResponseDto {
  id: string;
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  description: string | null;
  createdBy: string | null;
  createdAt: Date;

  constructor(history: OrderStatusHistory) {
    this.id = history.id;
    this.orderId = history.orderId;
    this.oldStatus = history.oldStatus;
    this.newStatus = history.newStatus;
    this.description = history.description;
    this.createdBy = history.createdBy;
    this.createdAt = history.createdAt;
  }
}
