import type { LoyaltyTransaction, Order } from '@prisma/client';

type LoyaltyTransactionWithOrder = LoyaltyTransaction & {
  order?: Order | null;
};

export class LoyaltyTransactionResponseDto {
  id: string;
  loyaltyCardId: string;
  orderId: string | null;
  orderNumber: string | null;
  transactionType: string;
  quantity: number;
  description: string | null;
  createdAt: Date;

  constructor(transaction: LoyaltyTransactionWithOrder) {
    this.id = transaction.id;
    this.loyaltyCardId = transaction.loyaltyCardId;
    this.orderId = transaction.orderId;
    this.orderNumber = transaction.order?.orderNumber ?? null;
    this.transactionType = transaction.transactionType;
    this.quantity = transaction.quantity;
    this.description = transaction.description;
    this.createdAt = transaction.createdAt;
  }
}
