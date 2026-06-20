import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { AdminUsersService } from './admin.service';
import { AdminCustomerResponseDto } from './dto/admin-customer-response.dto';
import { FilterAdminCustomersDto } from './dto/filter-admin-customers.dto';
import { UpdateAdminCustomerDto } from './dto/update-admin-customer.dto';
import { UpdateAdminCustomerStatusDto } from './dto/update-admin-customer-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  async findAll(@Query() query: FilterAdminCustomersDto) {
    return this.service.findAllCustomers(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<AdminCustomerResponseDto>> {
    const customer = await this.service.findOneCustomer(id);
    return { data: customer };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminCustomerDto,
  ): Promise<ApiResponse<AdminCustomerResponseDto>> {
    const customer = await this.service.updateCustomer(id, dto);
    return { data: customer };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminCustomerStatusDto,
  ): Promise<ApiResponse<AdminCustomerResponseDto>> {
    const customer = await this.service.updateCustomerStatus(id, dto);
    return { data: customer };
  }
}
