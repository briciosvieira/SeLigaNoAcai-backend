import type { LoyaltyProgram } from '@prisma/client';

export class LoyaltyProgramResponseDto {
  id: string;
  storeId: string;
  name: string;
  purchasesRequired: number;
  minimumOrderAmount: string;
  validityMonths: number;
  rewardDescription: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(program: LoyaltyProgram) {
    this.id = program.id;
    this.storeId = program.storeId;
    this.name = program.name;
    this.purchasesRequired = program.purchasesRequired;
    this.minimumOrderAmount = program.minimumOrderAmount.toString();
    this.validityMonths = program.validityMonths;
    this.rewardDescription = program.rewardDescription;
    this.isActive = program.isActive;
    this.createdAt = program.createdAt;
    this.updatedAt = program.updatedAt;
  }
}
