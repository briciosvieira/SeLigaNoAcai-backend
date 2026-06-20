import type {
  CustomerLoyaltyCard,
  LoyaltyProgram,
  LoyaltyTransaction,
  Order,
} from '@prisma/client';
import { LoyaltyTransactionResponseDto } from './loyalty-transaction-response.dto';

type LoyaltyTransactionWithOrder = LoyaltyTransaction & {
  order?: Order | null;
};

type LoyaltyCardWithRelations = CustomerLoyaltyCard & {
  loyaltyProgram?: LoyaltyProgram;
  transactions?: LoyaltyTransactionWithOrder[];
};

export class LoyaltyCardResponseDto {
  id: string;
  customerId: string;
  loyaltyProgramId: string;
  cardNumber: number;
  status: string;
  currentStamps: number;
  requiredStamps: number;
  startedAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  redeemedAt: Date | null;
  expiredAt: Date | null;
  rewardDescription: string;
  createdAt: Date;
  updatedAt: Date;

  program?: {
    id: string;
    name: string;
    purchasesRequired: number;
    minimumOrderAmount: string;
    validityMonths: number;
    rewardDescription: string | null;
  };

  transactions?: LoyaltyTransactionResponseDto[];

  constructor(card: LoyaltyCardWithRelations) {
    this.id = card.id;
    this.customerId = card.customerId;
    this.loyaltyProgramId = card.loyaltyProgramId;
    this.cardNumber = card.cardNumber;
    this.status = card.status;
    this.currentStamps = card.currentStamps;
    this.requiredStamps = card.requiredStamps;
    this.startedAt = card.startedAt;
    this.expiresAt = card.expiresAt;
    this.completedAt = card.completedAt;
    this.redeemedAt = card.redeemedAt;
    this.expiredAt = card.expiredAt;
    this.rewardDescription = card.rewardDescription;
    this.createdAt = card.createdAt;
    this.updatedAt = card.updatedAt;

    if (card.loyaltyProgram) {
      this.program = {
        id: card.loyaltyProgram.id,
        name: card.loyaltyProgram.name,
        purchasesRequired: card.loyaltyProgram.purchasesRequired,
        minimumOrderAmount: card.loyaltyProgram.minimumOrderAmount.toString(),
        validityMonths: card.loyaltyProgram.validityMonths,
        rewardDescription: card.loyaltyProgram.rewardDescription,
      };
    }

    if (card.transactions) {
      this.transactions = card.transactions.map(
        (transaction) => new LoyaltyTransactionResponseDto(transaction),
      );
    }
  }
}
