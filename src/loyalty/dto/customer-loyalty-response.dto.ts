import type { Customer, CustomerLoyalty, LoyaltyStampHistory } from '@prisma/client';

export class StampHistoryItemDto {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  orderId: string | null;
  createdAt: Date;

  constructor(h: LoyaltyStampHistory) {
    this.id = h.id;
    this.type = h.type;
    this.quantity = h.quantity;
    this.reason = h.reason;
    this.orderId = h.orderId;
    this.createdAt = h.createdAt;
  }
}

export class CustomerLoyaltyResponseDto {
  customerId: string;
  customerName: string | null;
  stamps: number;
  availableRewards: number;
  totalEarnedStamps: number;
  history: StampHistoryItemDto[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    loyalty: CustomerLoyalty,
    customer: Pick<Customer, 'id' | 'fullName'>,
    history: LoyaltyStampHistory[],
  ) {
    this.customerId = loyalty.customerId;
    this.customerName = customer.fullName;
    this.stamps = loyalty.stamps;
    this.availableRewards = loyalty.availableRewards;
    this.totalEarnedStamps = loyalty.totalEarnedStamps;
    this.history = history.map((h) => new StampHistoryItemDto(h));
    this.createdAt = loyalty.createdAt;
    this.updatedAt = loyalty.updatedAt;
  }
}
