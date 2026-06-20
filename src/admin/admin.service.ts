import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminPermission,
  AuthProvider,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { FilterAdminUsersDto } from './dto/filter-admin-users.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateAdminUserPermissionsDto } from './dto/update-admin-user-permissions.dto';
import { UpdateAdminUserRoleDto } from './dto/update-admin-user-role.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AdminCustomerResponseDto } from './dto/admin-customer-response.dto';
import { UpdateAdminCustomerStatusDto } from './dto/update-admin-customer-status.dto';
import { UpdateAdminCustomerDto } from './dto/update-admin-customer.dto';
import { FilterAdminCustomersDto } from './dto/filter-admin-customers.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterAdminUsersDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      isGuest: false,
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        include: {
          adminPermissions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: customers.map((customer) => new AdminUserResponseDto(customer)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<AdminUserResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        adminPermissions: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return new AdminUserResponseDto(customer);
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserResponseDto> {
    if (dto.role === UserRole.CUSTOMER && dto.permissions?.length) {
      throw new BadRequestException(
        'Cliente comum não pode receber permissões administrativas.',
      );
    }

    const emailAlreadyExists = await this.prisma.customer.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (emailAlreadyExists) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: dto.role,
          authProvider: AuthProvider.MANUAL,
          isGuest: false,
          isActive: true,
        },
      });

      if (dto.role !== UserRole.CUSTOMER && dto.permissions?.length) {
        await tx.customerAdminPermission.createMany({
          data: dto.permissions.map((permission) => ({
            customerId: created.id,
            permission,
          })),
          skipDuplicates: true,
        });
      }

      return tx.customer.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          adminPermissions: true,
        },
      });
    });

    return new AdminUserResponseDto(customer);
  }

  async update(
    id: string,
    dto: UpdateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    await this.ensureUserExists(id);

    if (dto.email) {
      const emailAlreadyExists = await this.prisma.customer.findFirst({
        where: {
          email: dto.email,
          id: {
            not: id,
          },
        },
      });

      if (emailAlreadyExists) {
        throw new ConflictException('Já existe outro usuário com este e-mail.');
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
      },
      include: {
        adminPermissions: true,
      },
    });

    return new AdminUserResponseDto(customer);
  }

  async updateRole(
    id: string,
    dto: UpdateAdminUserRoleDto,
    currentUserId: string,
  ): Promise<AdminUserResponseDto> {
    if (id === currentUserId && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não pode remover seu próprio cargo de administrador.',
      );
    }

    await this.ensureUserExists(id);

    const customer = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: {
          role: dto.role,
        },
      });

      if (updated.role === UserRole.CUSTOMER) {
        await tx.customerAdminPermission.deleteMany({
          where: {
            customerId: id,
          },
        });
      }

      return tx.customer.findUniqueOrThrow({
        where: { id },
        include: {
          adminPermissions: true,
        },
      });
    });

    return new AdminUserResponseDto(customer);
  }

  async updateStatus(
    id: string,
    dto: UpdateAdminUserStatusDto,
    currentUserId: string,
  ): Promise<AdminUserResponseDto> {
    if (id === currentUserId && dto.isActive === false) {
      throw new ForbiddenException(
        'Você não pode desativar seu próprio usuário.',
      );
    }

    await this.ensureUserExists(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        refreshTokenHash: dto.isActive ? undefined : null,
      },
      include: {
        adminPermissions: true,
      },
    });

    return new AdminUserResponseDto(customer);
  }

  async updatePermissions(
    id: string,
    dto: UpdateAdminUserPermissionsDto,
  ): Promise<AdminUserResponseDto> {
    const customer = await this.ensureUserExists(id);

    if (customer.role === UserRole.CUSTOMER) {
      throw new BadRequestException(
        'Cliente comum não pode receber permissões administrativas.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.customerAdminPermission.deleteMany({
        where: {
          customerId: id,
        },
      });

      if (dto.permissions.length) {
        await tx.customerAdminPermission.createMany({
          data: dto.permissions.map((permission: AdminPermission) => ({
            customerId: id,
            permission,
          })),
          skipDuplicates: true,
        });
      }

      return tx.customer.findUniqueOrThrow({
        where: { id },
        include: {
          adminPermissions: true,
        },
      });
    });

    return new AdminUserResponseDto(updated);
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<AdminUserResponseDto> {
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Você não pode remover seu próprio usuário.',
      );
    }

    await this.ensureUserExists(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
        refreshTokenHash: null,
      },
      include: {
        adminPermissions: true,
      },
    });

    return new AdminUserResponseDto(customer);
  }

  private async ensureUserExists(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return customer;
  }

  async findAllCustomers(query: FilterAdminCustomersDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      role: UserRole.CUSTOMER,
      ...(query.isActive !== undefined
        ? { isActive: query.isActive === 'true' }
        : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { cpf: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: customers.map((customer) => new AdminCustomerResponseDto(customer)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneCustomer(id: string): Promise<AdminCustomerResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    this.ensureTargetIsCustomer(customer.role);

    return new AdminCustomerResponseDto(customer);
  }

  async updateCustomer(
    id: string,
    dto: UpdateAdminCustomerDto,
  ): Promise<AdminCustomerResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    this.ensureTargetIsCustomer(customer.role);

    if (dto.email) {
      const emailAlreadyExists = await this.prisma.customer.findFirst({
        where: {
          email: dto.email,
          id: {
            not: id,
          },
        },
      });

      if (emailAlreadyExists) {
        throw new ConflictException('Já existe outro usuário com este e-mail.');
      }
    }

    if (dto.cpf) {
      const cpfAlreadyExists = await this.prisma.customer.findFirst({
        where: {
          cpf: dto.cpf,
          id: {
            not: id,
          },
        },
      });

      if (cpfAlreadyExists) {
        throw new ConflictException('Já existe outro usuário com este CPF.');
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        cpf: dto.cpf,
      },
    });

    return new AdminCustomerResponseDto(updated);
  }

  async updateCustomerStatus(
    id: string,
    dto: UpdateAdminCustomerStatusDto,
  ): Promise<AdminCustomerResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    this.ensureTargetIsCustomer(customer.role);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        refreshTokenHash: dto.isActive ? undefined : null,
      },
    });

    return new AdminCustomerResponseDto(updated);
  }

  private ensureTargetIsCustomer(role: UserRole): void {
    if (role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Este endpoint só permite gerenciar clientes. Administradores e funcionários não podem ser alterados por aqui.',
      );
    }
  }
}
