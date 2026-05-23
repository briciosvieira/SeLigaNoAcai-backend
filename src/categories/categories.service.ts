import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoriesRespondeDto } from './dto/category-response.dto';
import { paginate } from 'src/commom/utils/pagination.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Prisma } from '@prisma/client';
import { UpdateCategoryDto } from './dto/category-update-dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: PaginationQueryDto,
  ): Promise<ApiResponse<CategoriesRespondeDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const [categories, total] = await this.prisma.$transaction([
        this.prisma.category.findMany({
          skip,
          take,
          orderBy: {
            displayOrder: 'asc',
          },
        }),
        this.prisma.category.count(),
      ]);
      return {
        data: categories.map((category) => new CategoriesRespondeDto(category)),
        meta: meta(total),
      };
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new HttpException('Dados não encontrado', HttpStatus.NOT_FOUND);
      }
      throw new InternalServerErrorException('Erro ao buscar dados');
    }
  }

  async findOne(id: string): Promise<CategoriesRespondeDto> {
    try {
      const category = await this.prisma.category.findUnique({
        where: {
          id,
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada.');
      }

      return new CategoriesRespondeDto(category);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new HttpException(
          'Categoria não encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new InternalServerErrorException('Erro ao buscar dados');
    }
  }

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoriesRespondeDto> {
    try {
      const store = await this.prisma.store.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!store) {
        throw new NotFoundException('Loja ativa não encontrada.');
      }
      const lastCategory = await this.prisma.category.findFirst({
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
      const nextDisplayOrder = (lastCategory?.displayOrder ?? 0) + 1;

      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          slug: createCategoryDto.slug,
          displayOrder: nextDisplayOrder,
          isActive: createCategoryDto.isActive ?? true,

          store: {
            connect: {
              id: store.id,
            },
          },
        },
      });

      return new CategoriesRespondeDto(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma categoria cadastrada com este slug.',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoriesRespondeDto> {
    try {
      const category = await this.prisma.category.findUnique({
        where: {
          id,
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada.');
      }

      const updateCategory = await this.prisma.category.update({
        where: {
          id: category.id,
        },
        data: updateCategoryDto,
      });
      return new CategoriesRespondeDto(updateCategory);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma categoria cadastrada com este slug.',
        );
      }
      throw new InternalServerErrorException(
        'Não foi possível atualizar a categoria.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    try {
      await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Não foi possível remover a categoria.');
    }
  }
}
