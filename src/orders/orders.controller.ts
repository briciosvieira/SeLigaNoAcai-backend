import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrdersService, CreateOrderResult } from './orders.service';
import { TrackingOrderQueryDto } from './dto/tracking-order-query.dto';
import { OrderTrackingResponseDto } from './dto/order-tracking-response.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findMany(
    @Query() query: FilterOrdersDto,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    return this.service.findMany(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async findMyOrders(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: FilterOrdersDto,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    return this.service.findMyOrders(user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders/:id')
  async findMyOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<ApiResponse<OrderDetailResponseDto>> {
    const order = await this.service.findMyOrder(user.id, id);

    return {
      data: order,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<OrderDetailResponseDto>> {
    const order = await this.service.findOne(id);

    return {
      data: order,
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload | null,
    @Body() dto: CreateOrderDto,
  ): Promise<ApiResponse<CreateOrderResult>> {
    const result = await this.service.create(dto, user);

    return {
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.service.updateStatus(id, dto);

    return {
      data: order,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.service.updatePaymentStatus(id, dto);

    return {
      data: order,
    };
  }

  @Get('tracking/:orderNumber')
  async trackOrder(
    @Param('orderNumber') orderNumber: string,
    @Query() query: TrackingOrderQueryDto,
  ): Promise<ApiResponse<OrderTrackingResponseDto>> {
    const order = await this.service.trackOrder(orderNumber, query.phone);

    return {
      data: order,
    };
  }
}
