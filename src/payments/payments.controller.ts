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
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { FilterPaymentsDto } from './dto/filter-payments.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import type { InterPixWebhookPayload } from './providers/inter/inter.types';
import { PaymentsService } from './payments.service';
import { CreateManualPaymentDto } from './dto/create-manual-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('webhook/inter')
  async handleInterWebhook(
    @Body() payload: InterPixWebhookPayload,
  ): Promise<ApiResponse<{ received: boolean; processed: number }>> {
    const result = await this.service.handleInterWebhook(payload);

    return {
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findMany(
    @Query() query: FilterPaymentsDto,
  ): Promise<ApiResponse<PaymentResponseDto[]>> {
    return this.service.findMany(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('order/:orderId')
  async findByOrder(
    @Param('orderId') orderId: string,
  ): Promise<ApiResponse<PaymentResponseDto[]>> {
    const payments = await this.service.findByOrder(orderId);

    return {
      data: payments,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/order/:orderId')
  async findMyOrderPayments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('orderId') orderId: string,
  ): Promise<ApiResponse<PaymentResponseDto[]>> {
    const payments = await this.service.findByOrderForCustomer(
      orderId,
      user.id,
    );

    return {
      data: payments,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('order/:orderId/pix')
  async createPixPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePixPaymentDto,
  ): Promise<ApiResponse<PaymentResponseDto>> {
    const payment = await this.service.createPixPayment(orderId, dto);

    return {
      data: payment,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<PaymentResponseDto>> {
    const payment = await this.service.findOne(id);

    return {
      data: payment,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id/pix')
  async syncPixPayment(
    @Param('id') id: string,
  ): Promise<ApiResponse<PaymentResponseDto>> {
    const payment = await this.service.syncPixPayment(id);

    return {
      data: payment,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<ApiResponse<PaymentResponseDto>> {
    const payment = await this.service.updateStatus(id, dto);

    return {
      data: payment,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('order/:orderId/manual')
  async createManualPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateManualPaymentDto,
  ): Promise<ApiResponse<PaymentResponseDto>> {
    const payment = await this.service.createManualPayment(orderId, dto);

    return {
      data: payment,
    };
  }
}
