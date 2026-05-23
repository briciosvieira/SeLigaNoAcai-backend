import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeliveryZonesResponseDto } from './dto/delivery-zones-response';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { paginate } from 'src/commom/utils/pagination.util';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';

@Injectable()
export class DeliveryZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findManyZone(
    query: PaginationQueryDto,
  ): Promise<ApiResponse<DeliveryZonesResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const [zones, total] = await this.prisma.$transaction([
        this.prisma.deliveryZone.findMany({
          skip,
          take,
          orderBy: { displayOrder: 'asc' },
        }),
        this.prisma.deliveryZone.count(),
      ]);
      return {
        data: zones.map((zone) => new DeliveryZonesResponseDto(zone)),
        meta: meta(total),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Dados não encontrado');
    }
  }

  async findOneZone(id: string): Promise<DeliveryZonesResponseDto> {
    try {
      const zone = await this.prisma.deliveryZone.findUnique({
        where: { id },
      });

      if (!zone) {
        throw new NotFoundException('Nenhum dado encontrado');
      }
      return new DeliveryZonesResponseDto(zone);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Dados não encontrado');
    }
  }

  async create(
    createDeliveryZoneDto: CreateDeliveryZoneDto,
  ): Promise<DeliveryZonesResponseDto> {
    try {
      const lastDelivery = await this.prisma.deliveryZone.findFirst({
        where: {
          storeId: createDeliveryZoneDto.storeId,
        },
        orderBy: {
          displayOrder: 'desc',
        },
        select: {
          displayOrder: true,
        },
      });
      const nextDisplayOrder = (lastDelivery?.displayOrder ?? 0) + 1;

      const newZone = await this.prisma.deliveryZone.create({
        data: {
          ...createDeliveryZoneDto,
          displayOrder: nextDisplayOrder,
        },
      });
      return new DeliveryZonesResponseDto(newZone);
    } catch (error) {
      console.error('Erro ao criar zona de entrega:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Uma zona de entrega para este bairro já existe.',
        );
      }
      throw new InternalServerErrorException(
        'Não foi possível criar a zona de entrega.',
      );
    }
  }

  async update(
    id: string,
    updateDeliveryZoneDto: UpdateDeliveryZoneDto,
  ): Promise<DeliveryZonesResponseDto> {
    await this.findOneZone(id);

    try {
      const updatedZone = await this.prisma.deliveryZone.update({
        where: { id },
        data: updateDeliveryZoneDto,
      });
      return new DeliveryZonesResponseDto(updatedZone);
    } catch (error) {
      console.error('Erro ao atualizar zona de entrega:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Uma zona de entrega para este bairro já existe com esse nome.',
        );
      }
      throw new InternalServerErrorException(
        'Não foi possível atualizar a zona de entrega.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOneZone(id);

    try {
      await this.prisma.deliveryZone.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Não foi possível remover a zona de entrega.',
      );
    }
  }
}
