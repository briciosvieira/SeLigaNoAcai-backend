import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PromotionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalculatePromotionsDto } from './dto/calculate-promotions.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { UpdatePromotionStatusDto } from './dto/update-promotion-status.dto';

const FULL_INCLUDE = {
  buyProduct: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      basePrice: true,
      isActive: true,
    },
  },
  rewardProduct: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      basePrice: true,
      isActive: true,
    },
  },
  eligibleProducts: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          basePrice: true,
          isActive: true,
        },
      },
    },
  },
} as const;

const ACTIVE_PERIOD_FILTER = (now: Date) => ({
  isActive: true,
  OR: [{ startsAt: null }, { startsAt: { lte: now } }],
  AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
});

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: FULL_INCLUDE,
    });
  }

  async findActive() {
    const now = new Date();

    return this.prisma.promotion.findMany({
      where: ACTIVE_PERIOD_FILTER(now),
      orderBy: { createdAt: 'desc' },
      include: FULL_INCLUDE,
    });
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });

    if (!promotion) {
      throw new NotFoundException('Promoção não encontrada.');
    }

    return promotion;
  }

  async create(dto: CreatePromotionDto) {
    const normalizedCouponCode = this.normalizeCouponCode(dto.couponCode);

    await this.validatePromotionPayload(dto, normalizedCouponCode);

    try {
      return await this.prisma.promotion.create({
        data: {
          name: dto.name,
          description: dto.description,
          type: dto.type,
          couponCode: normalizedCouponCode,
          buyProductId: dto.buyProductId,
          buyQuantity: dto.buyQuantity ?? 1,
          rewardProductId: dto.rewardProductId,
          rewardQuantity: dto.rewardQuantity,
          discountPercent: dto.discountPercent,
          isActive: dto.isActive ?? true,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          eligibleProducts:
            dto.eligibleProductIds?.length
              ? {
                  create: dto.eligibleProductIds.map((productId) => ({
                    productId,
                  })),
                }
              : undefined,
        },
        include: FULL_INCLUDE,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Já existe uma promoção cadastrada com este código de cupom.',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const current = await this.findOne(id);

    const normalizedCouponCode =
      dto.couponCode !== undefined
        ? this.normalizeCouponCode(dto.couponCode)
        : (current.couponCode ?? undefined);

    await this.validatePromotionPayload(
      {
        name: dto.name ?? current.name,
        description: dto.description ?? current.description ?? undefined,
        type: dto.type ?? current.type,
        couponCode: normalizedCouponCode,
        eligibleProductIds: dto.eligibleProductIds,
        buyProductId: dto.buyProductId ?? current.buyProductId ?? undefined,
        buyQuantity: dto.buyQuantity ?? current.buyQuantity,
        rewardProductId:
          dto.rewardProductId ?? current.rewardProductId ?? undefined,
        rewardQuantity:
          dto.rewardQuantity ?? current.rewardQuantity ?? undefined,
        discountPercent:
          dto.discountPercent !== undefined
            ? dto.discountPercent
            : current.discountPercent !== null
              ? Number(current.discountPercent)
              : undefined,
        isActive: dto.isActive ?? current.isActive,
        startsAt:
          dto.startsAt ??
          (current.startsAt ? current.startsAt.toISOString() : undefined),
        endsAt:
          dto.endsAt ??
          (current.endsAt ? current.endsAt.toISOString() : undefined),
      },
      normalizedCouponCode,
      true,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.eligibleProductIds !== undefined) {
          await tx.promotionEligibleProduct.deleteMany({
            where: { promotionId: id },
          });

          if (dto.eligibleProductIds.length > 0) {
            await tx.promotionEligibleProduct.createMany({
              data: dto.eligibleProductIds.map((productId) => ({
                promotionId: id,
                productId,
              })),
              skipDuplicates: true,
            });
          }
        }

        return tx.promotion.update({
          where: { id },
          data: {
            name: dto.name,
            description: dto.description,
            type: dto.type,
            couponCode:
              dto.couponCode !== undefined ? normalizedCouponCode : undefined,
            buyProductId: dto.buyProductId,
            buyQuantity: dto.buyQuantity,
            rewardProductId: dto.rewardProductId,
            rewardQuantity: dto.rewardQuantity,
            discountPercent: dto.discountPercent,
            isActive: dto.isActive,
            startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
            endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          },
          include: FULL_INCLUDE,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Já existe uma promoção cadastrada com este código de cupom.',
        );
      }
      throw error;
    }
  }

  async updateStatus(id: string, dto: UpdatePromotionStatusDto) {
    await this.findOne(id);

    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.promotion.delete({ where: { id } });

    return { deleted: true };
  }

  async hasActiveCouponPromotion() {
    const now = new Date();

    const count = await this.prisma.promotion.count({
      where: {
        type: PromotionType.COUPON_PERCENTAGE_DISCOUNT,
        ...ACTIVE_PERIOD_FILTER(now),
      },
    });

    return { hasActiveCoupon: count > 0 };
  }

  async calculatePromotions(dto: CalculatePromotionsDto) {
    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice),
    }));

    const subtotal = this.roundMoney(
      items.reduce((sum, item) => sum + item.total, 0),
    );

    const normalizedCouponCode = this.normalizeCouponCode(dto.couponCode);

    if (normalizedCouponCode) {
      return this.calculateCouponPromotion({
        couponCode: normalizedCouponCode,
        items,
        subtotal,
      });
    }

    return this.calculateAutoPromotions(items, subtotal);
  }

  private async calculateAutoPromotions(
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
    subtotal: number,
  ) {
    const now = new Date();

    const activePromotions = await this.prisma.promotion.findMany({
      where: {
        type: { in: [PromotionType.BUY_X_GET_Y, PromotionType.PERCENTAGE_DISCOUNT] },
        ...ACTIVE_PERIOD_FILTER(now),
      },
      include: {
        buyProduct: {
          select: { id: true, name: true, imageUrl: true, basePrice: true, isActive: true },
        },
        rewardProduct: {
          select: { id: true, name: true, imageUrl: true, basePrice: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const appliedPromotions: Array<{
      promotionId: string;
      name: string;
      type: PromotionType;
      buyProductId: string | null;
      rewardProductId?: string | null;
      discountPercent?: number | null;
      discountAmount: number;
      freeQuantity?: number;
    }> = [];

    const freeItemsMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        imageUrl: string | null;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        promotionId: string;
        promotionName: string;
      }
    >();

    let discountAmount = 0;

    for (const promotion of activePromotions) {
      if (!promotion.buyProductId) continue;

      const matchingItems = items.filter(
        (item) => item.productId === promotion.buyProductId,
      );

      if (matchingItems.length === 0) continue;

      const purchasedQuantity = matchingItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      if (purchasedQuantity < promotion.buyQuantity) continue;

      const applicationCount = Math.floor(
        purchasedQuantity / promotion.buyQuantity,
      );

      if (applicationCount <= 0) continue;

      if (promotion.type === PromotionType.BUY_X_GET_Y) {
        if (!promotion.rewardProductId || !promotion.rewardProduct) continue;

        const rewardQuantity =
          applicationCount * Number(promotion.rewardQuantity ?? 1);

        const existingFreeItem = freeItemsMap.get(promotion.rewardProductId);

        if (existingFreeItem) {
          existingFreeItem.quantity += rewardQuantity;
        } else {
          freeItemsMap.set(promotion.rewardProductId, {
            productId: promotion.rewardProduct.id,
            productName: promotion.rewardProduct.name,
            imageUrl: promotion.rewardProduct.imageUrl,
            quantity: rewardQuantity,
            unitPrice: 0,
            totalAmount: 0,
            promotionId: promotion.id,
            promotionName: promotion.name,
          });
        }

        appliedPromotions.push({
          promotionId: promotion.id,
          name: promotion.name,
          type: promotion.type,
          buyProductId: promotion.buyProductId,
          rewardProductId: promotion.rewardProductId,
          discountAmount: 0,
          freeQuantity: rewardQuantity,
        });

        continue;
      }

      if (promotion.type === PromotionType.PERCENTAGE_DISCOUNT) {
        const percent = Number(promotion.discountPercent ?? 0);

        if (percent <= 0) continue;

        const eligibleAmount = matchingItems.reduce(
          (sum, item) => sum + item.total,
          0,
        );

        const promotionDiscount = this.roundMoney(
          eligibleAmount * (percent / 100),
        );

        discountAmount += promotionDiscount;

        appliedPromotions.push({
          promotionId: promotion.id,
          name: promotion.name,
          type: promotion.type,
          buyProductId: promotion.buyProductId,
          discountPercent: percent,
          discountAmount: promotionDiscount,
        });
      }
    }

    discountAmount = this.roundMoney(Math.min(discountAmount, subtotal));
    const total = this.roundMoney(subtotal - discountAmount);

    return {
      subtotal,
      discountAmount,
      freeItems: Array.from(freeItemsMap.values()),
      appliedPromotions,
      coupon: null,
      total,
    };
  }

  private async calculateCouponPromotion(params: {
    couponCode: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
  }) {
    const now = new Date();

    const promotion = await this.prisma.promotion.findFirst({
      where: {
        type: PromotionType.COUPON_PERCENTAGE_DISCOUNT,
        couponCode: params.couponCode,
        ...ACTIVE_PERIOD_FILTER(now),
      },
      include: {
        eligibleProducts: { select: { productId: true } },
      },
    });

    if (!promotion) {
      return {
        subtotal: params.subtotal,
        discountAmount: 0,
        freeItems: [],
        appliedPromotions: [],
        coupon: {
          code: params.couponCode,
          isApplied: false,
          message: 'Cupom inválido ou expirado.',
        },
        total: params.subtotal,
      };
    }

    const eligibleProductIds = new Set(
      promotion.eligibleProducts.map((ep) => ep.productId),
    );

    const eligibleAmount = this.roundMoney(
      params.items
        .filter((item) => eligibleProductIds.has(item.productId))
        .reduce((sum, item) => sum + item.total, 0),
    );

    if (eligibleAmount <= 0) {
      return {
        subtotal: params.subtotal,
        discountAmount: 0,
        freeItems: [],
        appliedPromotions: [],
        coupon: {
          code: params.couponCode,
          isApplied: false,
          message: 'Cupom não se aplica aos produtos do carrinho.',
        },
        total: params.subtotal,
      };
    }

    const percent = Number(promotion.discountPercent ?? 0);
    const discountAmount = this.roundMoney(eligibleAmount * (percent / 100));
    const total = this.roundMoney(params.subtotal - discountAmount);

    return {
      subtotal: params.subtotal,
      discountAmount,
      freeItems: [],
      appliedPromotions: [
        {
          promotionId: promotion.id,
          name: promotion.name,
          type: promotion.type,
          couponCode: params.couponCode,
          discountPercent: percent,
          discountAmount,
        },
      ],
      coupon: {
        code: params.couponCode,
        isApplied: true,
        message: 'Cupom aplicado com sucesso.',
        eligibleAmount,
        discountPercent: percent,
      },
      total,
    };
  }

  private async validatePromotionPayload(
    dto: CreatePromotionDto,
    normalizedCouponCode: string | undefined,
    isUpdate = false,
  ) {
    if (dto.type === PromotionType.COUPON_PERCENTAGE_DISCOUNT) {
      if (!normalizedCouponCode) {
        throw new BadRequestException('Código do cupom é obrigatório.');
      }

      if (dto.discountPercent === undefined || dto.discountPercent <= 0) {
        throw new BadRequestException(
          'Percentual de desconto deve ser maior que zero.',
        );
      }

      if (dto.discountPercent > 100) {
        throw new BadRequestException(
          'Percentual de desconto não pode ser maior que 100.',
        );
      }

      if (!isUpdate && (!dto.eligibleProductIds || dto.eligibleProductIds.length === 0)) {
        throw new BadRequestException(
          'Informe pelo menos um produto elegível para o cupom.',
        );
      }

      if (dto.eligibleProductIds?.length) {
        await this.ensureProductsExist(dto.eligibleProductIds);
      }

      return;
    }

    if (!dto.buyProductId) {
      throw new BadRequestException('Produto da compra é obrigatório.');
    }

    if (!dto.buyQuantity || dto.buyQuantity < 1) {
      throw new BadRequestException(
        'Quantidade mínima de compra deve ser maior que zero.',
      );
    }

    await this.ensureProductExists(dto.buyProductId);

    if (dto.type === PromotionType.BUY_X_GET_Y) {
      if (!dto.rewardProductId) {
        throw new BadRequestException(
          'Produto de recompensa é obrigatório para promoção Compre X Leve Y.',
        );
      }

      if (!dto.rewardQuantity || dto.rewardQuantity < 1) {
        throw new BadRequestException(
          'Quantidade de recompensa deve ser maior que zero.',
        );
      }

      await this.ensureProductExists(dto.rewardProductId);
      return;
    }

    if (dto.type === PromotionType.PERCENTAGE_DISCOUNT) {
      if (dto.discountPercent === undefined || dto.discountPercent <= 0) {
        throw new BadRequestException(
          'Percentual de desconto deve ser maior que zero.',
        );
      }

      if (dto.discountPercent > 100) {
        throw new BadRequestException(
          'Percentual de desconto não pode ser maior que 100.',
        );
      }

      return;
    }

    throw new BadRequestException('Tipo de promoção inválido.');
  }

  private normalizeCouponCode(code?: string | null): string | undefined {
    if (!code) return undefined;
    const normalized = code.trim().toUpperCase();
    return normalized.length > 0 ? normalized : undefined;
  }

  private async ensureProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Produto informado não encontrado.');
    }
  }

  private async ensureProductsExist(productIds: string[]) {
    const found = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    if (found.length !== productIds.length) {
      throw new NotFoundException(
        'Um ou mais produtos elegíveis não foram encontrados.',
      );
    }
  }

  private roundMoney(value: number) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }
}
