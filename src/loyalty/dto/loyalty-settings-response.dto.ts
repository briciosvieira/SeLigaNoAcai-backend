import type { LoyaltySettings } from '@prisma/client';

export class LoyaltySettingsResponseDto {
  id: string;
  isEnabled: boolean;
  title: string;
  description: string | null;
  cardImageUrl: string | null;
  minOrderAmount: string;
  stampsRequired: number;
  validityMonths: number;
  rewardDescription: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(s: LoyaltySettings) {
    this.id = s.id;
    this.isEnabled = s.isEnabled;
    this.title = s.title;
    this.description = s.description;
    this.cardImageUrl = s.cardImageUrl;
    this.minOrderAmount = s.minOrderAmount.toString();
    this.stampsRequired = s.stampsRequired;
    this.validityMonths = s.validityMonths;
    this.rewardDescription = s.rewardDescription;
    this.createdAt = s.createdAt;
    this.updatedAt = s.updatedAt;
  }
}
