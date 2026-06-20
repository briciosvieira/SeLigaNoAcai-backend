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
import { Prisma, Store } from '@prisma/client';
import { UpdateStoreAvailabilityDto } from './dto/update-store-availability.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds the current active store.
   * Based on the business rule of a single active store system.
   * Throws a NotFoundException if no active store is found.
   */
  private async getCurrentStoreOrFail(): Promise<Store> {
    const store = await this.prisma.store.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }

    return store;
  }

  /**
   * Checks if a scheduled availability change is due and applies it.
   * @param store - The store entity to check.
   * @returns The updated store entity if the status was changed, otherwise the original store entity.
   */
  private async normalizeScheduledAvailability(store: Store): Promise<Store> {
    if (
      store.scheduledIsOpen === null ||
      store.scheduledIsOpen === undefined ||
      !store.availabilityChangeAt
    ) {
      return store;
    }

    const now = new Date();

    // If the scheduled change time has not been reached yet, do nothing.
    if (store.availabilityChangeAt > now) {
      return store;
    }

    // The scheduled time has passed. Apply the new status and clear the schedule.
    return this.prisma.store.update({
      where: {
        id: store.id,
      },
      data: {
        isOpen: store.scheduledIsOpen,
        scheduledIsOpen: null,
        availabilityChangeAt: null,
        availabilityUpdatedAt: now,
      },
    });
  }

  /**
   * Appends the calculated availability object to the store entity.
   * @param store - The store entity.
   * @returns The store entity enhanced with the 'availability' object.
   */
  private resolveStoreAvailability(store: Store) {
    const now = new Date();

    const hasSchedule =
      store.scheduledIsOpen !== null &&
      store.scheduledIsOpen !== undefined &&
      Boolean(store.availabilityChangeAt);

    const remainingSeconds =
      hasSchedule && store.availabilityChangeAt
      ? Math.max(
          0,
          Math.floor(
            (store.availabilityChangeAt.getTime() - now.getTime()) / 1000,
          ),
        )
      : 0;

    let nextLabel: 'Abre em' | 'Fecha em' | null = null;

    if (hasSchedule) {
      nextLabel = store.scheduledIsOpen ? 'Abre em' : 'Fecha em';
    }

    const response = new StoreResponseDto(store);

    return {
      ...response,
      isOpen: store.isOpen,
      scheduledIsOpen: store.scheduledIsOpen,
      availabilityChangeAt: store.availabilityChangeAt,
      availabilityUpdatedAt: store.availabilityUpdatedAt,
      availability: {
        isOpen: store.isOpen,
        label: store.isOpen ? 'Aberto' : 'Fechado',
        nextLabel,
        scheduledIsOpen: store.scheduledIsOpen,
        availabilityChangeAt: store.availabilityChangeAt,
        availabilityUpdatedAt: store.availabilityUpdatedAt,
        remainingSeconds,
      },
    };
  }

  /**
   * Gets the current store with its calculated availability status.
   * It normalizes the status if the timer has expired before returning.
   */
  async findCurrent() {
    const store = await this.getCurrentStoreOrFail();
    const normalizedStore = await this.normalizeScheduledAvailability(store);
    return this.resolveStoreAvailability(normalizedStore);
  }

  /**
   * Schedules a future change for the store's availability status.
   * @param dto - The data transfer object containing the future status and the time until the change.
   */
  async updateCurrentStoreAvailability(dto: UpdateStoreAvailabilityDto) {
    const store = await this.getCurrentStoreOrFail();

    const now = new Date();
    const availabilityChangeAt = new Date(
      now.getTime() + dto.durationMinutes * 60 * 1000,
    );

    const updatedStore = await this.prisma.store.update({
      where: { id: store.id },
      data: {
        scheduledIsOpen: dto.isOpen,
        availabilityChangeAt,
        availabilityUpdatedAt: now,
      },
    });

    return this.resolveStoreAvailability(updatedStore);
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
      return new StoreResponseDto(currentStore);
    } catch (e) {
      console.error('Erro ao criar loja:', e);
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
      const currentStore = await this.getCurrentStoreOrFail();
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

  async remove(id: string): Promise<void> {
    try {
      const findCurrent = await this.prisma.store.findFirst({
        where: { id: id },
      });

      if (!findCurrent) {
        throw new NotFoundException('Loja não encontrada');
      }

      await this.prisma.store.delete({
        where: {
          id: findCurrent.id,
        },
      });
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      console.error('Erro ao deletar loja:', e);
      throw new InternalServerErrorException(
        'Não foi possível deletar a loja.',
      );
    }
  }
}
