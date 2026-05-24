import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { OptionGroupResponseDto } from './dto/option-group-response.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { OptionResponseDto } from './dto/option-response.dto';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { paginate } from 'src/commom/utils/pagination.util';

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findManyGroups(
    query: PaginationQueryDto,
  ): Promise<ApiResponse<OptionGroupResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const [groups, total] = await this.prisma.$transaction([
        this.prisma.optionGroup.findMany({
          where: {
            isActive: true,
          },
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
          skip,
          take,
          orderBy: {
            displayOrder: 'asc',
          },
        }),
        this.prisma.optionGroup.count({
          where: { isActive: true },
        }),
      ]);

      return {
        data: groups.map((group) => new OptionGroupResponseDto(group)),
        meta: meta(total),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar grupos de opções.',
      );
    }
  }

  async findOneGroup(id: string): Promise<OptionGroupResponseDto> {
    try {
      const group = await this.prisma.optionGroup.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      });

      if (!group) {
        throw new NotFoundException('Grupo de opções não encontrado.');
      }

      return new OptionGroupResponseDto(group);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Erro ao buscar o grupo de opções.',
      );
    }
  }

  async createGroup(
    dto: CreateOptionGroupDto,
  ): Promise<OptionGroupResponseDto> {
    try {
      const store = await this.prisma.store.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!store) {
        throw new NotFoundException('Loja ativa não encontrada.');
      }

      const lastGroup = await this.prisma.optionGroup.findFirst({
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

      const nextDisplayOrder = (lastGroup?.displayOrder ?? 0) + 1;

      const group = await this.prisma.optionGroup.create({
        data: {
          store: {
            connect: {
              id: store.id,
            },
          },
          name: dto.name,
          slug: dto.slug,
          selectionType: dto.selectionType,
          minSelected: dto.minSelected ?? 0,
          maxSelected: dto.maxSelected,
          isRequired: dto.isRequired ?? false,
          isActive: dto.isActive ?? true,
          displayOrder: nextDisplayOrder,
        },
        include: {
          options: true,
        },
      });

      return new OptionGroupResponseDto(group);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um grupo de opções cadastrado com este slug.',
        );
      }

      throw new InternalServerErrorException(
        'Não foi possível criar o grupo de opções.',
      );
    }
  }

  async createOption(
    groupId: string,
    dto: CreateOptionDto,
  ): Promise<OptionResponseDto> {
    try {
      const option = await this.prisma.$transaction(async (tx) => {
        const group = await tx.optionGroup.findUnique({
          where: {
            id: groupId,
          },
          select: {
            id: true,
          },
        });

        if (!group) {
          throw new NotFoundException('Grupo de opções não encontrado.');
        }

        const lastOption = await tx.option.findFirst({
          where: {
            optionGroupId: groupId,
          },
          orderBy: {
            displayOrder: 'desc',
          },
          select: {
            displayOrder: true,
          },
        });

        const nextDisplayOrder = (lastOption?.displayOrder ?? 0) + 1;

        return tx.option.create({
          data: {
            optionGroup: {
              connect: {
                id: groupId,
              },
            },
            name: dto.name,
            description: dto.description,
            emoji: dto.emoji,
            additionalPrice: dto.additionalPrice ?? 0,
            isActive: dto.isActive ?? true,
            displayOrder: nextDisplayOrder,
          },
        });
      });

      return new OptionResponseDto(option);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma opção cadastrada com este nome neste grupo.',
        );
      }

      throw new InternalServerErrorException('Não foi possível criar a opção.');
    }
  }

  async updateGroup(
    id: string,
    dto: UpdateOptionGroupDto,
  ): Promise<OptionGroupResponseDto> {
    await this.findOneGroup(id);

    try {
      const updatedGroup = await this.prisma.optionGroup.update({
        where: { id },
        data: dto,
        include: {
          options: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      return new OptionGroupResponseDto(updatedGroup);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um grupo de opções cadastrado com este slug.',
        );
      }
      throw new InternalServerErrorException(
        'Não foi possível atualizar o grupo de opções.',
      );
    }
  }

  async removeGroup(id: string): Promise<void> {
    await this.findOneGroup(id);

    try {
      await this.prisma.optionGroup.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Não foi possível remover o grupo de opções.',
      );
    }
  }

  async updateOption(
    id: string,
    dto: UpdateOptionDto,
  ): Promise<OptionResponseDto> {
    const option = await this.prisma.option.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Opção não encontrada.');

    try {
      const updatedOption = await this.prisma.option.update({
        where: { id },
        data: dto,
      });
      return new OptionResponseDto(updatedOption);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma opção com este nome neste grupo.',
        );
      }
      throw new InternalServerErrorException(
        'Não foi possível atualizar a opção.',
      );
    }
  }

  async removeOption(id: string): Promise<void> {
    const option = await this.prisma.option.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Opção não encontrada.');

    try {
      await this.prisma.option.delete({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(
        'Não foi possível remover a opção.',
      );
    }
  }
}
