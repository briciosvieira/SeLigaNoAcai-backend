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

@Injectable()
export class DeliveryZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findZone(): Promise<DeliveryZonesResponseDto[]> {
    try {
      const zones = await this.prisma.deliveryZone.findMany({
        where: { isAvailable: true },
      });

      return zones.map((zone) => new DeliveryZonesResponseDto(zone));
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
      const newZone = await this.prisma.deliveryZone.create({
        data: createDeliveryZoneDto,
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
