import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { CustomerAddressResponseDto } from './dto/customer-address-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpsertMyDefaultAddressDto } from './dto/upsert-my-default-address.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMe(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    const customer = await this.service.findMe(user.id);

    return {
      data: customer,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCustomerDto,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    const customer = await this.service.updateMe(user.id, dto);

    return {
      data: customer,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/address/default')
  async findMyDefaultAddress(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CustomerAddressResponseDto | null>> {
    const address = await this.service.findMyDefaultAddress(user.id);

    return {
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/address/default')
  async upsertMyDefaultAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpsertMyDefaultAddressDto,
  ): Promise<ApiResponse<CustomerAddressResponseDto>> {
    const address = await this.service.upsertMyDefaultAddress(user.id, dto);

    return {
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/addresses')
  async findMyAddresses(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CustomerAddressResponseDto[]>> {
    const addresses = await this.service.findMyAddresses(user.id);

    return {
      data: addresses,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/addresses')
  async createMyAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCustomerAddressDto,
  ): Promise<ApiResponse<CustomerAddressResponseDto>> {
    const address = await this.service.createMyAddress(user.id, dto);

    return {
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/addresses/:addressId')
  async updateMyAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateCustomerAddressDto,
  ): Promise<ApiResponse<CustomerAddressResponseDto>> {
    const address = await this.service.updateMyAddress(user.id, addressId, dto);

    return {
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/addresses/:addressId')
  async removeMyAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('addressId') addressId: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.service.removeMyAddress(user.id, addressId);

    return {
      data: {
        deleted: true,
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findMany(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<CustomerResponseDto[]>> {
    return this.service.findMany(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    const customer = await this.service.findOne(id);

    return {
      data: customer,
    };
  }
}
