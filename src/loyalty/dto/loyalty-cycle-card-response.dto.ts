import type { LoyaltyCard, LoyaltyCardStatus } from '@prisma/client';

export class LoyaltyCycleCardResponseDto {
  id: string;
  status: LoyaltyCardStatus;
  stamps: number;
  stampsRequired: number;
  minOrderAmount: string;
  rewardDescription: string;
  startedAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  redeemedAt: Date | null;
  createdAt: Date;

  constructor(c: LoyaltyCard) {
    this.id = c.id;
    this.status = c.status;
    this.stamps = c.stamps;
    this.stampsRequired = c.stampsRequired;
    this.minOrderAmount = c.minOrderAmount.toString();
    this.rewardDescription = c.rewardDescription;
    this.startedAt = c.startedAt;
    this.expiresAt = c.expiresAt;
    this.completedAt = c.completedAt;
    this.redeemedAt = c.redeemedAt;
    this.createdAt = c.createdAt;
  }
}
