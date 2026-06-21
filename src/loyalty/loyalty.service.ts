import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  LoyaltyCardStatus,
  LoyaltyStampHistoryType,
  LoyaltyTransactionType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { addMonths } from 'date-fns';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdjustLoyaltyCardDto } from './dto/adjust-loyalty-card.dto';
import { CreateLoyaltyProgramDto } from './dto/create-loyalty-program.dto';
import { CustomerLoyaltyResponseDto } from './dto/customer-loyalty-response.dto';
import { LoyaltyCardResponseDto } from './dto/loyalty-card-response.dto';
import { LoyaltyCycleCardResponseDto } from './dto/loyalty-cycle-card-response.dto';
import { LoyaltyProgramResponseDto } from './dto/loyalty-program-response.dto';
import { LoyaltySettingsResponseDto } from './dto/loyalty-settings-response.dto';
import { StampActionDto } from './dto/stamp-action.dto';
import { UpdateLoyaltyProgramDto } from './dto/update-loyalty-program.dto';
import { UpdateLoyaltySettingsDto } from './dto/update-loyalty-settings.dto';

type LoyaltyTx = Prisma.TransactionClient;

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getSettings(): Promise<LoyaltySettingsResponseDto> {
    const settings = await this.prisma.loyaltySettings.findFirst();
    if (!settings) throw new NotFoundException('Configurações de fidelidade não encontradas.');
    return new LoyaltySettingsResponseDto(settings);
  }

  async updateSettings(dto: UpdateLoyaltySettingsDto): Promise<LoyaltySettingsResponseDto> {
    try {
      let settings = await this.prisma.loyaltySettings.findFirst();
      if (!settings) throw new NotFoundException('Configurações de fidelidade não encontradas.');

      settings = await this.prisma.loyaltySettings.update({
        where: { id: settings.id },
        data: {
          ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.cardImageUrl !== undefined && { cardImageUrl: dto.cardImageUrl }),
          ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
          ...(dto.stampsRequired !== undefined && { stampsRequired: dto.stampsRequired }),
          ...(dto.validityMonths !== undefined && { validityMonths: dto.validityMonths }),
          ...(dto.rewardDescription !== undefined && { rewardDescription: dto.rewardDescription }),
        },
      });

      return new LoyaltySettingsResponseDto(settings);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Não foi possível atualizar as configurações.');
    }
  }

  // ─── Cliente: cartão fidelidade por ciclo ──────────────────────────────────

  async getMyLoyalty(customerId: string): Promise<
    ApiResponse<{
      settings: LoyaltySettingsResponseDto;
      currentCard: LoyaltyCycleCardResponseDto | null;
      previousCards: LoyaltyCycleCardResponseDto[];
      availableRewards: number;
      customerName: string | null;
    }>
  > {
    const settings = await this.prisma.loyaltySettings.findFirst();
    if (!settings) throw new NotFoundException('Configurações de fidelidade não encontradas.');
    if (!settings.isEnabled) {
      throw new ForbiddenException('O programa de fidelidade está desativado.');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const allCards = await this.prisma.loyaltyCard.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    const currentCard =
      allCards.find(
        (c) => c.status === LoyaltyCardStatus.ACTIVE || c.status === LoyaltyCardStatus.COMPLETED,
      ) ?? null;

    const previousCards = allCards.filter(
      (c) => c.status === LoyaltyCardStatus.REDEEMED || c.status === LoyaltyCardStatus.EXPIRED,
    );

    const availableRewards = allCards.filter((c) => c.status === LoyaltyCardStatus.COMPLETED).length;

    return {
      data: {
        settings: new LoyaltySettingsResponseDto(settings),
        currentCard: currentCard ? new LoyaltyCycleCardResponseDto(currentCard) : null,
        previousCards: previousCards.map((c) => new LoyaltyCycleCardResponseDto(c)),
        availableRewards,
        customerName: customer.fullName,
      },
    };
  }

  // ─── Admin: customers ───────────────────────────────────────────────────────

  async adminGetCustomers(search?: string): Promise<
    ApiResponse<{
      customerId: string;
      customerName: string | null;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
      googleAvatarUrl: string | null;
      customerCode: string | null;
      stamps: number;
      availableRewards: number;
      totalEarnedStamps: number;
    }[]>
  > {
    const loyalties = await this.prisma.customerLoyalty.findMany({
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            googleAvatarUrl: true,
            customerCode: true,
          },
        },
      },
      where: search
        ? {
            customer: {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { customerCode: { contains: search } },
              ],
            },
          }
        : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      data: loyalties.map((l) => ({
        customerId: l.customerId,
        customerName: l.customer.fullName,
        email: l.customer.email,
        phone: l.customer.phone,
        avatarUrl: l.customer.avatarUrl,
        googleAvatarUrl: l.customer.googleAvatarUrl,
        customerCode: l.customer.customerCode,
        stamps: l.stamps,
        availableRewards: l.availableRewards,
        totalEarnedStamps: l.totalEarnedStamps,
      })),
    };
  }

  async adminGetCustomerLoyalty(customerId: string): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const { loyalty, history } = await this.getOrCreateLoyalty(customerId);
    return { data: new CustomerLoyaltyResponseDto(loyalty, customer, history) };
  }

  async adminAddStamps(customerId: string, dto: StampActionDto): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const settings = await this.prisma.loyaltySettings.findFirst();
    if (!settings) throw new NotFoundException('Configurações de fidelidade não encontradas.');

    const { loyalty } = await this.getOrCreateLoyalty(customerId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const newStamps = loyalty.stamps + dto.quantity;
      const rewardsEarned = Math.floor(newStamps / settings.stampsRequired);
      const finalStamps = newStamps % settings.stampsRequired;

      const result = await tx.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          stamps: rewardsEarned > 0 ? finalStamps : newStamps,
          availableRewards: loyalty.availableRewards + rewardsEarned,
          totalEarnedStamps: loyalty.totalEarnedStamps + dto.quantity,
        },
      });

      await tx.loyaltyStampHistory.create({
        data: {
          customerLoyalty: { connect: { id: loyalty.id } },
          type: LoyaltyStampHistoryType.ADMIN_ADD,
          quantity: dto.quantity,
          reason: dto.reason ?? 'Adicionado pelo admin.',
        },
      });

      if (rewardsEarned > 0) {
        await tx.loyaltyStampHistory.create({
          data: {
            customerLoyalty: { connect: { id: loyalty.id } },
            type: LoyaltyStampHistoryType.REWARD_GRANTED,
            quantity: rewardsEarned,
            reason: 'Brinde liberado por ajuste do admin.',
          },
        });
      }

      // Sync active LoyaltyCard (cycle card)
      await this.syncCycleCardStamps(tx, customerId, dto.quantity, settings);

      return result;
    });

    const history = await this.prisma.loyaltyStampHistory.findMany({
      where: { customerLoyaltyId: loyalty.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { data: new CustomerLoyaltyResponseDto(updated, customer, history) };
  }

  async adminRemoveStamps(customerId: string, dto: StampActionDto): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const { loyalty } = await this.getOrCreateLoyalty(customerId);

    if (loyalty.stamps < dto.quantity) {
      throw new BadRequestException(
        `Cliente tem apenas ${loyalty.stamps} selos. Não é possível remover ${dto.quantity}.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          stamps: loyalty.stamps - dto.quantity,
          totalEarnedStamps: Math.max(0, loyalty.totalEarnedStamps - dto.quantity),
        },
      });

      await tx.loyaltyStampHistory.create({
        data: {
          customerLoyalty: { connect: { id: loyalty.id } },
          type: LoyaltyStampHistoryType.ADMIN_REMOVE,
          quantity: dto.quantity,
          reason: dto.reason ?? 'Removido pelo admin.',
        },
      });

      // Sync active LoyaltyCard (cycle card)
      const activeCard = await tx.loyaltyCard.findFirst({
        where: { customerId, status: LoyaltyCardStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
      });

      if (activeCard) {
        const newStamps = Math.max(0, activeCard.stamps - dto.quantity);
        await tx.loyaltyCard.update({
          where: { id: activeCard.id },
          data: { stamps: newStamps },
        });
      }

      return result;
    });

    const history = await this.prisma.loyaltyStampHistory.findMany({
      where: { customerLoyaltyId: loyalty.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { data: new CustomerLoyaltyResponseDto(updated, customer, history) };
  }

  async adminRedeemReward(customerId: string): Promise<ApiResponse<{ redeemedCardId: string; message: string }>> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const completedCard = await this.prisma.loyaltyCard.findFirst({
      where: { customerId, status: LoyaltyCardStatus.COMPLETED },
      orderBy: { completedAt: 'asc' },
    });

    if (!completedCard) {
      throw new BadRequestException('Este cliente não possui cartões completos para resgatar.');
    }

    const redeemed = await this.prisma.$transaction(async (tx) => {
      const card = await tx.loyaltyCard.update({
        where: { id: completedCard.id },
        data: {
          status: LoyaltyCardStatus.REDEEMED,
          redeemedAt: new Date(),
        },
      });

      // Also decrement availableRewards in CustomerLoyalty if it exists
      const loyalty = await tx.customerLoyalty.findUnique({ where: { customerId } });
      if (loyalty && loyalty.availableRewards > 0) {
        await tx.customerLoyalty.update({
          where: { id: loyalty.id },
          data: { availableRewards: loyalty.availableRewards - 1 },
        });

        await tx.loyaltyStampHistory.create({
          data: {
            customerLoyalty: { connect: { id: loyalty.id } },
            type: LoyaltyStampHistoryType.REWARD_REDEEMED,
            quantity: 1,
            reason: 'Brinde entregue pelo administrador.',
          },
        });
      }

      return card;
    });

    return {
      data: {
        redeemedCardId: redeemed.id,
        message: `Brinde resgatado com sucesso para ${customer.fullName ?? 'o cliente'}.`,
      },
    };
  }

  // ─── Stamp ao concluir pedido (chamado pelo OrdersService) ─────────────────

  async tryAddStampForOrder(tx: LoyaltyTx, orderId: string): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) return;
    // Processa em PAID (PIX confirmado) ou DELIVERED (entregue)
    if (order.orderStatus !== OrderStatus.DELIVERED && order.orderStatus !== OrderStatus.PAID) return;
    if (!order.customerId || !order.customer || order.customer.isGuest) return;

    const settings = await tx.loyaltySettings.findFirst();
    if (!settings || !settings.isEnabled) return;

    const totalAmount = Number(order.totalAmount);
    const minAmount = Number(settings.minOrderAmount);

    // Quantidade de selos = floor(valorTotal / valorMínimo)
    // Ex: R$16 = 1 selo, R$31 = 1 selo, R$32 = 2 selos, R$160 = 10 selos
    const stampQuantity = Math.floor(totalAmount / minAmount);
    if (stampQuantity < 1) return;

    // Idempotência: impede carimbo duplicado no mesmo pedido
    const alreadyStamped = await tx.loyaltyStampHistory.findFirst({
      where: { orderId: order.id, type: LoyaltyStampHistoryType.ORDER_EARNED },
      select: { id: true },
    });
    if (alreadyStamped) return;

    // ── LoyaltyCard (ciclo) ───────────────────────────────────────────────────
    let cycleCard = await tx.loyaltyCard.findFirst({
      where: { customerId: order.customerId, status: LoyaltyCardStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });

    if (!cycleCard) {
      cycleCard = await tx.loyaltyCard.create({
        data: {
          customer: { connect: { id: order.customerId } },
          stamps: 0,
          stampsRequired: settings.stampsRequired,
          minOrderAmount: settings.minOrderAmount,
          rewardDescription: settings.rewardDescription,
          startedAt: new Date(),
          expiresAt: addMonths(new Date(), settings.validityMonths),
          status: LoyaltyCardStatus.ACTIVE,
        },
      });
    }

    // Soma os selos e limita ao máximo do cartão
    const newCycleStamps = Math.min(cycleCard.stamps + stampQuantity, cycleCard.stampsRequired);
    const cardCompleted = newCycleStamps >= cycleCard.stampsRequired;

    await tx.loyaltyCard.update({
      where: { id: cycleCard.id },
      data: {
        stamps: newCycleStamps,
        status: cardCompleted ? LoyaltyCardStatus.COMPLETED : LoyaltyCardStatus.ACTIVE,
        completedAt: cardCompleted ? new Date() : null,
      },
    });

    // ── CustomerLoyalty + history (rastreamento admin) ────────────────────────
    let loyalty = await tx.customerLoyalty.findUnique({
      where: { customerId: order.customerId },
    });
    if (!loyalty) {
      loyalty = await tx.customerLoyalty.create({
        data: {
          customer: { connect: { id: order.customerId } },
          stamps: 0,
          availableRewards: 0,
          totalEarnedStamps: 0,
        },
      });
    }

    const loyaltyNewStamps = loyalty.stamps + stampQuantity;
    const rewardsEarned = cardCompleted ? 1 : 0;
    const finalLoyaltyStamps = cardCompleted ? loyaltyNewStamps % settings.stampsRequired : loyaltyNewStamps;

    await tx.customerLoyalty.update({
      where: { id: loyalty.id },
      data: {
        stamps: finalLoyaltyStamps,
        availableRewards: loyalty.availableRewards + rewardsEarned,
        totalEarnedStamps: loyalty.totalEarnedStamps + stampQuantity,
      },
    });

    await tx.loyaltyStampHistory.create({
      data: {
        customerLoyalty: { connect: { id: loyalty.id } },
        order: { connect: { id: order.id } },
        type: LoyaltyStampHistoryType.ORDER_EARNED,
        quantity: stampQuantity,
        reason: `${stampQuantity} carimbo(s) gerado(s) pelo pedido ${order.orderNumber} (R$${totalAmount.toFixed(2)}).`,
      },
    });

    if (rewardsEarned > 0) {
      await tx.loyaltyStampHistory.create({
        data: {
          customerLoyalty: { connect: { id: loyalty.id } },
          order: { connect: { id: order.id } },
          type: LoyaltyStampHistoryType.REWARD_GRANTED,
          quantity: rewardsEarned,
          reason: 'Brinde liberado ao completar o cartão fidelidade.',
        },
      });
    }
  }

  // ─── Legacy: programas e cartões antigos (mantidos sem alteração) ───────────

  async findPrograms(): Promise<LoyaltyProgramResponseDto[]> {
    try {
      const programs = await this.prisma.loyaltyProgram.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return programs.map((p) => new LoyaltyProgramResponseDto(p));
    } catch {
      throw new InternalServerErrorException('Não foi possível buscar os programas de fidelidade.');
    }
  }

  async createProgram(dto: CreateLoyaltyProgramDto): Promise<LoyaltyProgramResponseDto> {
    try {
      const store = await this.prisma.store.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!store) throw new NotFoundException('Loja ativa não encontrada.');

      const program = await this.prisma.loyaltyProgram.create({
        data: {
          store: { connect: { id: store.id } },
          name: dto.name,
          purchasesRequired: dto.purchasesRequired ?? 10,
          minimumOrderAmount: dto.minimumOrderAmount ?? 16,
          validityMonths: dto.validityMonths ?? 10,
          rewardDescription: dto.rewardDescription,
          isActive: dto.isActive ?? true,
        },
      });
      return new LoyaltyProgramResponseDto(program);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um programa de fidelidade ativo para esta loja.');
      }
      throw new InternalServerErrorException('Não foi possível criar o programa de fidelidade.');
    }
  }

  async updateProgram(id: string, dto: UpdateLoyaltyProgramDto): Promise<LoyaltyProgramResponseDto> {
    try {
      const current = await this.prisma.loyaltyProgram.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Programa de fidelidade não encontrado.');

      const program = await this.prisma.loyaltyProgram.update({
        where: { id },
        data: {
          name: dto.name,
          purchasesRequired: dto.purchasesRequired,
          minimumOrderAmount: dto.minimumOrderAmount,
          validityMonths: dto.validityMonths,
          rewardDescription: dto.rewardDescription,
          isActive: dto.isActive,
        },
      });
      return new LoyaltyProgramResponseDto(program);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Não foi possível atualizar o programa de fidelidade.');
    }
  }

  async removeProgram(id: string): Promise<void> {
    try {
      const program = await this.prisma.loyaltyProgram.findUnique({ where: { id }, select: { id: true } });
      if (!program) throw new NotFoundException('Programa de fidelidade não encontrado.');
      await this.prisma.loyaltyProgram.delete({ where: { id } });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Não é possível remover um programa que já possui cartões vinculados.');
      }
      throw new InternalServerErrorException('Não foi possível remover o programa de fidelidade.');
    }
  }

  async findMyLoyalty(customerId: string): Promise<
    ApiResponse<{ activeCard: LoyaltyCardResponseDto | null; cards: LoyaltyCardResponseDto[] }>
  > {
    const cards = await this.findCardsByCustomer(customerId);
    const activeCard =
      cards.find(
        (c) => c.status === LoyaltyCardStatus.ACTIVE || c.status === LoyaltyCardStatus.REWARD_AVAILABLE,
      ) ?? null;
    return { data: { activeCard, cards } };
  }

  async findMyCards(customerId: string): Promise<LoyaltyCardResponseDto[]> {
    return this.findCardsByCustomer(customerId);
  }

  async findMyCard(customerId: string, id: string): Promise<LoyaltyCardResponseDto> {
    const card = await this.prisma.customerLoyaltyCard.findFirst({
      where: { id, customerId },
      include: this.cardInclude(),
    });
    if (!card) throw new NotFoundException('Cartão fidelidade não encontrado.');
    return new LoyaltyCardResponseDto(card);
  }

  async findCustomerLoyalty(customerId: string): Promise<LoyaltyCardResponseDto[]> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');
    return this.findCardsByCustomer(customerId);
  }

  async redeemCard(cardId: string): Promise<LoyaltyCardResponseDto> {
    try {
      const newCard = await this.prisma.$transaction(async (tx) => {
        const card = await tx.customerLoyaltyCard.findUnique({
          where: { id: cardId },
          include: { loyaltyProgram: true },
        });
        if (!card) throw new NotFoundException('Cartão fidelidade não encontrado.');
        if (card.status !== LoyaltyCardStatus.REWARD_AVAILABLE) {
          throw new BadRequestException('Este cartão não possui brinde disponível para retirada.');
        }

        await tx.customerLoyaltyCard.update({
          where: { id: card.id },
          data: { status: LoyaltyCardStatus.REDEEMED, redeemedAt: new Date() },
        });

        await tx.loyaltyTransaction.create({
          data: {
            loyaltyCard: { connect: { id: card.id } },
            transactionType: LoyaltyTransactionType.REWARD_REDEEMED,
            quantity: 0,
            description: 'Brinde retirado pelo cliente.',
          },
        });

        return this.createNewCard(tx, {
          customerId: card.customerId,
          programId: card.loyaltyProgramId,
          rewardDescription: card.loyaltyProgram.rewardDescription ?? card.rewardDescription,
          requiredStamps: card.loyaltyProgram.purchasesRequired,
          validityMonths: card.loyaltyProgram.validityMonths,
        });
      });

      const card = await this.prisma.customerLoyaltyCard.findUnique({
        where: { id: newCard.id },
        include: this.cardInclude(),
      });
      if (!card) throw new NotFoundException('Cartão fidelidade não encontrado.');
      return new LoyaltyCardResponseDto(card);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Não foi possível resgatar o brinde.');
    }
  }

  async adjustCard(cardId: string, dto: AdjustLoyaltyCardDto): Promise<LoyaltyCardResponseDto> {
    try {
      const card = await this.prisma.$transaction(async (tx) => {
        const current = await tx.customerLoyaltyCard.findUnique({ where: { id: cardId } });
        if (!current) throw new NotFoundException('Cartão fidelidade não encontrado.');
        if (
          current.status !== LoyaltyCardStatus.ACTIVE &&
          current.status !== LoyaltyCardStatus.REWARD_AVAILABLE
        ) {
          throw new BadRequestException('Este cartão não permite ajustes de carimbo.');
        }

        const nextStamps = Math.max(
          0,
          Math.min(current.requiredStamps, current.currentStamps + dto.quantity),
        );
        const shouldComplete = nextStamps >= current.requiredStamps && current.status === LoyaltyCardStatus.ACTIVE;

        const updated = await tx.customerLoyaltyCard.update({
          where: { id: cardId },
          data: {
            currentStamps: nextStamps,
            status: shouldComplete ? LoyaltyCardStatus.REWARD_AVAILABLE : current.status,
            completedAt: shouldComplete ? new Date() : current.completedAt,
          },
        });

        await tx.loyaltyTransaction.create({
          data: {
            loyaltyCard: { connect: { id: cardId } },
            transactionType: LoyaltyTransactionType.ADJUSTMENT,
            quantity: dto.quantity,
            description: dto.description ?? 'Ajuste manual de fidelidade.',
          },
        });

        if (shouldComplete) {
          await tx.loyaltyTransaction.create({
            data: {
              loyaltyCard: { connect: { id: cardId } },
              transactionType: LoyaltyTransactionType.REWARD_AVAILABLE,
              quantity: 0,
              description: 'Brinde liberado após ajuste manual.',
            },
          });
        }

        return updated;
      });

      const updated = await this.prisma.customerLoyaltyCard.findUnique({
        where: { id: card.id },
        include: this.cardInclude(),
      });
      if (!updated) throw new NotFoundException('Cartão fidelidade não encontrado.');
      return new LoyaltyCardResponseDto(updated);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Não foi possível ajustar o cartão fidelidade.');
    }
  }

  async expireOverdueCards(): Promise<{ expired: number }> {
    try {
      const now = new Date();
      const overdueCards = await this.prisma.customerLoyaltyCard.findMany({
        where: { status: LoyaltyCardStatus.ACTIVE, expiresAt: { lt: now } },
        select: { id: true },
      });

      if (overdueCards.length === 0) return { expired: 0 };

      await this.prisma.$transaction(async (tx) => {
        for (const card of overdueCards) {
          await tx.customerLoyaltyCard.update({
            where: { id: card.id },
            data: { status: LoyaltyCardStatus.EXPIRED, expiredAt: now },
          });
          await tx.loyaltyTransaction.create({
            data: {
              loyaltyCard: { connect: { id: card.id } },
              transactionType: LoyaltyTransactionType.CARD_EXPIRED,
              quantity: 0,
              description: 'Cartão expirado automaticamente.',
            },
          });
        }
      });

      return { expired: overdueCards.length };
    } catch {
      throw new InternalServerErrorException('Não foi possível expirar cartões vencidos.');
    }
  }

  // ─── Helpers privados ───────────────────────────────────────────────────────

  private async getOrCreateLoyalty(customerId: string) {
    let loyalty = await this.prisma.customerLoyalty.findUnique({
      where: { customerId },
    });
    if (!loyalty) {
      loyalty = await this.prisma.customerLoyalty.create({
        data: {
          customer: { connect: { id: customerId } },
          stamps: 0,
          availableRewards: 0,
          totalEarnedStamps: 0,
        },
      });
    }

    const history = await this.prisma.loyaltyStampHistory.findMany({
      where: { customerLoyaltyId: loyalty.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return { loyalty, history };
  }

  private async syncCycleCardStamps(
    tx: LoyaltyTx,
    customerId: string,
    quantity: number,
    settings: { stampsRequired: number; minOrderAmount: object; rewardDescription: string; validityMonths: number },
  ): Promise<void> {
    let activeCard = await tx.loyaltyCard.findFirst({
      where: { customerId, status: LoyaltyCardStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeCard) {
      activeCard = await tx.loyaltyCard.create({
        data: {
          customer: { connect: { id: customerId } },
          stamps: 0,
          stampsRequired: settings.stampsRequired,
          minOrderAmount: settings.minOrderAmount as Prisma.Decimal,
          rewardDescription: settings.rewardDescription,
          startedAt: new Date(),
          expiresAt: addMonths(new Date(), settings.validityMonths),
          status: LoyaltyCardStatus.ACTIVE,
        },
      });
    }

    const newStamps = Math.min(activeCard.stamps + quantity, activeCard.stampsRequired);
    const cardCompleted = newStamps >= activeCard.stampsRequired;

    await tx.loyaltyCard.update({
      where: { id: activeCard.id },
      data: {
        stamps: newStamps,
        status: cardCompleted ? LoyaltyCardStatus.COMPLETED : LoyaltyCardStatus.ACTIVE,
        completedAt: cardCompleted ? new Date() : null,
      },
    });
  }

  private async findCardsByCustomer(customerId: string): Promise<LoyaltyCardResponseDto[]> {
    const cards = await this.prisma.customerLoyaltyCard.findMany({
      where: { customerId },
      include: this.cardInclude(),
      orderBy: { cardNumber: 'desc' },
    });
    return cards.map((c) => new LoyaltyCardResponseDto(c));
  }

  private async createNewCard(
    tx: LoyaltyTx,
    params: {
      customerId: string;
      programId: string;
      rewardDescription: string;
      requiredStamps: number;
      validityMonths: number;
    },
  ) {
    const lastCard = await tx.customerLoyaltyCard.findFirst({
      where: { customerId: params.customerId },
      orderBy: { cardNumber: 'desc' },
      select: { cardNumber: true },
    });

    const nextCardNumber = (lastCard?.cardNumber ?? 0) + 1;

    return tx.customerLoyaltyCard.create({
      data: {
        customer: { connect: { id: params.customerId } },
        loyaltyProgram: { connect: { id: params.programId } },
        cardNumber: nextCardNumber,
        currentStamps: 0,
        requiredStamps: params.requiredStamps,
        rewardDescription: params.rewardDescription,
        startedAt: new Date(),
        expiresAt: addMonths(new Date(), params.validityMonths),
        status: LoyaltyCardStatus.ACTIVE,
      },
    });
  }

  private cardInclude() {
    return {
      loyaltyProgram: true,
      transactions: {
        include: { order: true },
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }
}
