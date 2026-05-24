import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-products.dto';
import { UpdateProductDto } from './dto/update-products.dto';
import { paginate } from 'src/commom/utils/pagination.util';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findProductMany(
    query: PaginationQueryDto,
  ): Promise<ApiResponse<ProductResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const [products, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          skip,
          take,
          orderBy: {
            displayOrder: 'asc',
          },
        }),
        this.prisma.product.count(),
      ]);
      return {
        data: products.map((product) => new ProductResponseDto(product)),
        meta: meta(total),
      };
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new HttpException('Dados não encontrado', HttpStatus.NOT_FOUND);
      }
      throw new InternalServerErrorException('Erro ao buscar dados');
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }

      return new ProductResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar o produto.');
    }
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      const store = await this.prisma.store.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!store) {
        throw new NotFoundException('Loja ativa não encontrada.');
      }

      const lastProduct = await this.prisma.product.findFirst({
        where: {
          storeId: store.id,
        },
        orderBy: {
          displayOrder: 'desc',
        },
        select: {
          displayOrder: true,
        },
      });

      const nextDisplayOrder = (lastProduct?.displayOrder ?? 0) + 1;

      const product = await this.prisma.product.create({
        data: {
          store: {
            connect: {
              id: store.id,
            },
          },

          ...(dto.categoryId && {
            category: {
              connect: {
                id: dto.categoryId,
              },
            },
          }),

          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          emoji: dto.emoji,
          imageUrl: dto.imageUrl,
          basePrice: dto.basePrice,
          oldPrice: dto.oldPrice,
          badge: dto.badge,
          productType: dto.productType ?? 'SIMPLE',
          isFeatured: dto.isFeatured ?? false,
          isOffer: dto.isOffer ?? false,
          isActive: dto.isActive ?? true,
          displayOrder: nextDisplayOrder,
        },
      });

      return new ProductResponseDto(product);
    } catch (error) {
      console.error('Erro ao criar produto:', error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um produto cadastrado com este slug.',
        );
      }

      throw new InternalServerErrorException(
        'Não foi possível criar o produto.',
      );
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    await this.findOne(id);

    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: dto,
      });
      return new ProductResponseDto(updatedProduct);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um produto cadastrado com este slug.',
        );
      }
      throw new InternalServerErrorException(
        'Não foi possível atualizar o produto.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    try {
      await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      throw new InternalServerErrorException(
        'Não foi possível remover o produto.',
      );
    }
  }

  async findVariantsByProduct(
    productId: string,
  ): Promise<ProductVariantResponseDto[]> {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const variants = await this.prisma.productVariant.findMany({
      where: {
        productId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return variants.map((variant) => new ProductVariantResponseDto(variant));
  }

  async createVariant(
    productId: string,
    dto: CreateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    try {
      const variant = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: {
            id: productId,
          },
          select: {
            id: true,
          },
        });

        if (!product) {
          throw new NotFoundException('Produto não encontrado.');
        }

        const lastVariant = await tx.productVariant.findFirst({
          where: {
            productId,
          },
          orderBy: {
            displayOrder: 'desc',
          },
          select: {
            displayOrder: true,
          },
        });

        const existingDefault = await tx.productVariant.findFirst({
          where: {
            productId,
            isDefault: true,
          },
          select: {
            id: true,
          },
        });

        const nextDisplayOrder = (lastVariant?.displayOrder ?? 0) + 1;

        const shouldBeDefault = dto.isDefault ?? !existingDefault;

        if (shouldBeDefault) {
          await tx.productVariant.updateMany({
            where: {
              productId,
            },
            data: {
              isDefault: false,
            },
          });
        }

        return tx.productVariant.create({
          data: {
            product: {
              connect: {
                id: productId,
              },
            },
            name: dto.name,
            price: dto.price,
            isDefault: shouldBeDefault,
            isActive: dto.isActive ?? true,
            displayOrder: nextDisplayOrder,
          },
        });
      });

      return new ProductVariantResponseDto(variant);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma variação cadastrada com este nome para este produto.',
        );
      }

      throw new InternalServerErrorException(
        'Não foi possível criar a variação do produto.',
      );
    }
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    try {
      const variant = await this.prisma.$transaction(async (tx) => {
        const currentVariant = await tx.productVariant.findFirst({
          where: {
            id: variantId,
            productId,
          },
        });

        if (!currentVariant) {
          throw new NotFoundException('Variação do produto não encontrada.');
        }

        if (dto.isDefault === true) {
          await tx.productVariant.updateMany({
            where: {
              productId,
              id: {
                not: variantId,
              },
            },
            data: {
              isDefault: false,
            },
          });
        }

        return tx.productVariant.update({
          where: {
            id: variantId,
          },
          data: {
            name: dto.name,
            price: dto.price,
            isDefault: dto.isDefault,
            isActive: dto.isActive,
          },
        });
      });

      return new ProductVariantResponseDto(variant);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma variação cadastrada com este nome para este produto.',
        );
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar a variação do produto.',
      );
    }
  }

  async removeVariant(
    productId: string,
    variantId: string,
  ): Promise<{ id: string; deleted: boolean }> {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variação do produto não encontrada.');
    }

    await this.prisma.productVariant.delete({
      where: {
        id: variantId,
      },
    });

    return {
      id: variantId,
      deleted: true,
    };
  }
}
