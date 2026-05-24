import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  async findMany(
    @Query() query: FilterOrdersDto,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    return this.service.findMany(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.service.findOne(id);

    return {
      data: order,
    };
  }

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.service.create(dto);

    return {
      data: order,
    };
  }

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
}
