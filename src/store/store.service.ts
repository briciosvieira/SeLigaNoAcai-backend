import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreResponseDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(): Promise<StoreResponseDto> {
    try {
      const store = await this.prisma.store.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!store) {
        throw new NotFoundException('Lojas não encontrada');
      }

      return new StoreResponseDto(store);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException('Não encontrei dados');
    }
  }

  async createCurrent(dto: CreateStoreDto): Promise<StoreResponseDto> {
    try {
      const currentStore = await this.prisma.store.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          logoUrl: dto.logoUrl,
          whatsappNumber: dto.whatsappNumber,
          ifoodUrl: dto.ifoodUrl,
          pixKey: dto.pixKey,
          pixKeyType: dto.pixKeyType,
          rating: dto.rating,
          maxDeliveryMinutes: dto.maxDeliveryMinutes,
          minDeliveryMinutes: dto.minDeliveryMinutes,
          minimumOrderAmount: dto.minimumOrderAmount,
          isActive: true,
        },
      });
      if (dto.slug === currentStore.slug) {
        throw new ConflictException('Já existe essa tag');
      }
      return new StoreResponseDto(currentStore);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma loja cadastrada com este slug/tag.',
        );
      }
      throw new HttpException(
        'Erro ao cadastrar novos dados para a loja',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCurrent(dto: UpdateStoreDto): Promise<StoreResponseDto> {
    try {
      const currentStore = await this.prisma.store.findFirst({
        where: {
          isActive: true,
        },
      });
      if (!currentStore) {
        throw new NotFoundException('Loja não encontrada');
      }
      const updateStore = await this.prisma.store.update({
        where: {
          id: currentStore.id,
        },
        data: {
          name: dto.name,
          slug: dto.slug,
          logoUrl: dto.logoUrl,
          whatsappNumber: dto.whatsappNumber,
          ifoodUrl: dto.ifoodUrl,
          pixKey: dto.pixKey,
          pixKeyType: dto.pixKeyType,
          rating: dto.rating,
          minDeliveryMinutes: dto.minDeliveryMinutes,
          maxDeliveryMinutes: dto.maxDeliveryMinutes,
          minimumOrderAmount: dto.minimumOrderAmount,
          isActive: dto.isActive,
        },
      });
      return new StoreResponseDto(updateStore);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException('Não foi possivel atualizar');
    }
  }

  async currentDelete(id: string) {
    try {
      const findCurrent = await this.prisma.store.findFirst({
        where: { id: id },
      });

      if (!findCurrent) {
        throw new HttpException('Loja não encontrada', HttpStatus.NOT_FOUND);
      }

      await this.prisma.store.delete({
        where: {
          id: findCurrent.id,
        },
      });
      return {
        message: 'Loja deletada',
      };
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new NotFoundException('não foi possivel deletar!');
      }
      throw new InternalServerErrorException('Não foi possivel deletar');
    }
  }
}
