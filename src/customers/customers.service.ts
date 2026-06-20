import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { paginate } from 'src/commom/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { CustomerAddressResponseDto } from './dto/customer-address-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpsertMyDefaultAddressDto } from './dto/upsert-my-default-address.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: PaginationQueryDto,
  ): Promise<ApiResponse<CustomerResponseDto[]>> {
    try {
      const { skip, take, meta } = paginate(query.page, query.limit);

      const [customers, total] = await this.prisma.$transaction([
        this.prisma.customer.findMany({
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.customer.count(),
      ]);

      return {
        data: customers.map((customer) => new CustomerResponseDto(customer)),
        meta: meta(total),
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar clientes.');
    }
  }

  async findOne(id: string): Promise<CustomerResponseDto> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: {
          id,
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado.');
      }

      return new CustomerResponseDto(customer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao buscar cliente.');
    }
  }

  async findMe(customerId: string): Promise<CustomerResponseDto> {
    return this.findOne(customerId);
  }

  async updateMe(
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado.');
      }

      const updatedCustomer = await this.prisma.customer.update({
        where: {
          id: customerId,
        },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          cpf: dto.cpf,
        },
      });

      return new CustomerResponseDto(updatedCustomer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('CPF já cadastrado para outro cliente.');
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar seus dados.',
      );
    }
  }

  async findMyAddresses(
    customerId: string,
  ): Promise<CustomerAddressResponseDto[]> {
    try {
      const addresses = await this.prisma.customerAddress.findMany({
        where: {
          customerId,
        },
        orderBy: [
          {
            isDefault: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

      return addresses.map(
        (address) => new CustomerAddressResponseDto(address),
      );
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar endereços.');
    }
  }

  async createMyAddress(
    customerId: string,
    dto: CreateCustomerAddressDto,
  ): Promise<CustomerAddressResponseDto> {
    try {
      const address = await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({
          where: {
            id: customerId,
          },
          select: {
            id: true,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado.');
        }

        const deliveryZone = await tx.deliveryZone.findFirst({
          where: {
            id: dto.deliveryZoneId,
            isAvailable: true,
          },
        });

        if (!deliveryZone) {
          throw new NotFoundException('Zona de entrega não encontrada.');
        }

        const addressesCount = await tx.customerAddress.count({
          where: {
            customerId,
          },
        });

        const shouldBeDefault = dto.isDefault ?? addressesCount === 0;

        if (shouldBeDefault) {
          await tx.customerAddress.updateMany({
            where: {
              customerId,
            },
            data: {
              isDefault: false,
            },
          });
        }

        return tx.customerAddress.create({
          data: {
            customer: {
              connect: {
                id: customerId,
              },
            },
            deliveryZone: {
              connect: {
                id: deliveryZone.id,
              },
            },
            label: dto.label,
            street: dto.street,
            number: dto.number,
            complement: dto.complement,
            referencePoint: dto.referencePoint,
            neighborhood: deliveryZone.neighborhood,
            city: deliveryZone.city,
            state: deliveryZone.state,
            isDefault: shouldBeDefault,
          },
        });
      });

      return new CustomerAddressResponseDto(address);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível criar o endereço.',
      );
    }
  }

  async updateMyAddress(
    customerId: string,
    addressId: string,
    dto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddressResponseDto> {
    try {
      const address = await this.prisma.$transaction(async (tx) => {
        const currentAddress = await tx.customerAddress.findFirst({
          where: {
            id: addressId,
            customerId,
          },
        });

        if (!currentAddress) {
          throw new NotFoundException('Endereço não encontrado.');
        }

        let deliveryZone: {
          id: string;
          neighborhood: string;
          city: string;
          state: string;
        } | null = null;

        if (dto.deliveryZoneId) {
          deliveryZone = await tx.deliveryZone.findFirst({
            where: {
              id: dto.deliveryZoneId,
              isAvailable: true,
            },
            select: {
              id: true,
              neighborhood: true,
              city: true,
              state: true,
            },
          });

          if (!deliveryZone) {
            throw new NotFoundException('Zona de entrega não encontrada.');
          }
        }

        if (dto.isDefault === true) {
          await tx.customerAddress.updateMany({
            where: {
              customerId,
            },
            data: {
              isDefault: false,
            },
          });
        }

        const updateData: Prisma.CustomerAddressUpdateInput = {
          label: dto.label,
          street: dto.street,
          number: dto.number,
          complement: dto.complement,
          referencePoint: dto.referencePoint,
          isDefault: dto.isDefault,
        };

        if (deliveryZone) {
          updateData.deliveryZone = {
            connect: {
              id: deliveryZone.id,
            },
          };
          updateData.neighborhood = deliveryZone.neighborhood;
          updateData.city = deliveryZone.city;
          updateData.state = deliveryZone.state;
        }

        return tx.customerAddress.update({
          where: {
            id: addressId,
          },
          data: updateData,
        });
      });

      return new CustomerAddressResponseDto(address);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível atualizar o endereço.',
      );
    }
  }

  async findMyDefaultAddress(
    customerId: string,
  ): Promise<CustomerAddressResponseDto | null> {
    const address = await this.prisma.customerAddress.findFirst({
      where: { customerId, isDefault: true },
      include: { deliveryZone: true },
    });

    return address ? new CustomerAddressResponseDto(address) : null;
  }

  async upsertMyDefaultAddress(
    customerId: string,
    dto: UpsertMyDefaultAddressDto,
  ): Promise<CustomerAddressResponseDto> {
    try {
      const address = await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { id: true },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado.');
        }

        const deliveryZone = await tx.deliveryZone.findFirst({
          where: { id: dto.deliveryZoneId, isAvailable: true },
        });

        if (!deliveryZone) {
          throw new NotFoundException(
            'Zona de entrega não encontrada ou indisponível.',
          );
        }

        const currentDefault = await tx.customerAddress.findFirst({
          where: { customerId, isDefault: true },
        });

        await tx.customerAddress.updateMany({
          where: {
            customerId,
            isDefault: true,
            id: currentDefault ? { not: currentDefault.id } : undefined,
          },
          data: { isDefault: false },
        });

        const addressFields = {
          deliveryZone: { connect: { id: deliveryZone.id } },
          label: dto.label ?? null,
          street: dto.street ?? null,
          number: dto.number ?? null,
          complement: dto.complement ?? null,
          referencePoint: dto.referencePoint ?? null,
          neighborhood: deliveryZone.neighborhood,
          city: deliveryZone.city,
          state: deliveryZone.state,
          isDefault: true as const,
        };

        if (currentDefault) {
          return tx.customerAddress.update({
            where: { id: currentDefault.id },
            data: addressFields,
            include: { deliveryZone: true },
          });
        }

        return tx.customerAddress.create({
          data: {
            customer: { connect: { id: customerId } },
            ...addressFields,
          },
          include: { deliveryZone: true },
        });
      });

      return new CustomerAddressResponseDto(address);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Não foi possível salvar o endereço padrão.',
      );
    }
  }

  async removeMyAddress(customerId: string, addressId: string): Promise<void> {
    try {
      const address = await this.prisma.customerAddress.findFirst({
        where: {
          id: addressId,
          customerId,
        },
      });

      if (!address) {
        throw new NotFoundException('Endereço não encontrado.');
      }

      await this.prisma.customerAddress.delete({
        where: {
          id: addressId,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível remover o endereço.',
      );
    }
  }
}
