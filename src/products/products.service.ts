import {
  BadRequestException,
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
import { CreateProductOptionGroupDto } from './dto/create-product-option-group.dto';
import { UpdateProductOptionGroupDto } from './dto/update-product-option-group.dto';
import { ProductOptionGroupResponseDto } from './dto/product-option-group-response.dto';

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

  async findOne(id: string): Promise<any> {
    try {
      const productWithDetails = await this.prisma.product.findUnique({
        where: { id, isActive: true },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
          productOptionGroups: {
            where: {
              optionGroup: { isActive: true },
            },
            include: {
              optionGroup: {
                include: {
                  options: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                  },
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!productWithDetails) {
        throw new NotFoundException('Produto não encontrado.');
      }

      const { productOptionGroups, variants, ...productData } =
        productWithDetails;

      const mappedOptionGroups = productOptionGroups.map((pog) => {
        const { optionGroup } = pog;
        const options = optionGroup.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          description: opt.description,
          additionalPrice: opt.additionalPrice ?? 0,
          isActive: opt.isActive,
        }));

        return {
          id: optionGroup.id,
          name: optionGroup.name,
          minSelected: pog.minSelected ?? 0,
          maxSelected: pog.maxSelected ?? options.length,
          isActive: optionGroup.isActive,
          options,
        };
      });

      return {
        ...new ProductResponseDto(productData),
        variants: variants.map(
          (variant) => new ProductVariantResponseDto(variant),
        ),
        optionGroups: mappedOptionGroups,
      };
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
          mobileImageUrl: dto.mobileImageUrl,
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

  async findOptionGroupsByProduct(
    productId: string,
  ): Promise<ProductOptionGroupResponseDto[]> {
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

    const productOptionGroups = await this.prisma.productOptionGroup.findMany({
      where: {
        productId,
      },
      include: {
        optionGroup: {
          include: {
            options: {
              where: {
                isActive: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return productOptionGroups.map(
      (productOptionGroup) =>
        new ProductOptionGroupResponseDto(productOptionGroup),
    );
  }

  async createProductOptionGroup(
    productId: string,
    dto: CreateProductOptionGroupDto,
  ): Promise<ProductOptionGroupResponseDto> {
    try {
      const productOptionGroup = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: {
            id: productId,
          },
          select: {
            id: true,
            storeId: true,
          },
        });

        if (!product) {
          throw new NotFoundException('Produto não encontrado.');
        }

        const optionGroup = await tx.optionGroup.findUnique({
          where: {
            id: dto.optionGroupId,
          },
          select: {
            id: true,
            storeId: true,
          },
        });

        if (!optionGroup) {
          throw new NotFoundException('Grupo de opções não encontrado.');
        }

        if (product.storeId !== optionGroup.storeId) {
          throw new BadRequestException(
            'O grupo de opções não pertence à mesma loja do produto.',
          );
        }

        const lastProductOptionGroup = await tx.productOptionGroup.findFirst({
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

        const nextDisplayOrder =
          (lastProductOptionGroup?.displayOrder ?? 0) + 1;

        return tx.productOptionGroup.create({
          data: {
            product: {
              connect: {
                id: productId,
              },
            },
            optionGroup: {
              connect: {
                id: dto.optionGroupId,
              },
            },
            minSelected: dto.minSelected,
            maxSelected: dto.maxSelected,
            isRequired: dto.isRequired,
            displayOrder: nextDisplayOrder,
          },
          include: {
            optionGroup: {
              include: {
                options: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    displayOrder: 'asc',
                  },
                },
              },
            },
          },
        });
      });

      return new ProductOptionGroupResponseDto(productOptionGroup);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Este grupo de opções já está vinculado a este produto.',
        );
      }

      throw new InternalServerErrorException(
        'Não foi possível vincular o grupo de opções ao produto.',
      );
    }
  }

  async updateProductOptionGroup(
    productId: string,
    id: string,
    dto: UpdateProductOptionGroupDto,
  ): Promise<ProductOptionGroupResponseDto> {
    try {
      const currentProductOptionGroup =
        await this.prisma.productOptionGroup.findFirst({
          where: {
            id,
            productId,
          },
        });

      if (!currentProductOptionGroup) {
        throw new NotFoundException(
          'Grupo de opções do produto não encontrado.',
        );
      }

      const updatedProductOptionGroup =
        await this.prisma.productOptionGroup.update({
          where: {
            id,
          },
          data: {
            minSelected: dto.minSelected,
            maxSelected: dto.maxSelected,
            isRequired: dto.isRequired,
            displayOrder: dto.displayOrder,
          },
          include: {
            optionGroup: {
              include: {
                options: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    displayOrder: 'asc',
                  },
                },
              },
            },
          },
        });

      return new ProductOptionGroupResponseDto(updatedProductOptionGroup);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar o grupo de opções do produto.',
      );
    }
  }

  async removeProductOptionGroup(productId: string, id: string): Promise<void> {
    const productOptionGroup = await this.prisma.productOptionGroup.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!productOptionGroup) {
      throw new NotFoundException('Grupo de opções do produto não encontrado.');
    }

    try {
      await this.prisma.productOptionGroup.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Não foi possível remover o grupo de opções do produto.',
      );
    }
  }
}
