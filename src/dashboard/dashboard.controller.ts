import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  async summary(@Query() query: DashboardFilterDto): Promise<ApiResponse<any>> {
    const data = await this.service.summary(query);

    return {
      data,
    };
  }

  @Get('orders')
  async orders(@Query() query: DashboardFilterDto): Promise<ApiResponse<any>> {
    const data = await this.service.orders(query);

    return {
      data,
    };
  }

  @Get('revenue')
  async revenue(@Query() query: DashboardFilterDto): Promise<ApiResponse<any>> {
    const data = await this.service.revenue(query);

    return {
      data,
    };
  }

  @Get('payments')
  async payments(
    @Query() query: DashboardFilterDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.service.payments(query);

    return {
      data,
    };
  }

  @Get('customers')
  async customers(
    @Query() query: DashboardFilterDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.service.customers(query);

    return {
      data,
    };
  }

  @Get('loyalty')
  async loyalty(): Promise<ApiResponse<any>> {
    const data = await this.service.loyalty();

    return {
      data,
    };
  }

  @Get('orders/pending')
  async pendingOrders(
    @Query() query: DashboardFilterDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.service.pendingOrders(query);

    return {
      data,
    };
  }
}
