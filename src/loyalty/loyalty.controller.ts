import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AdjustLoyaltyCardDto } from './dto/adjust-loyalty-card.dto';
import { CreateLoyaltyProgramDto } from './dto/create-loyalty-program.dto';
import { CustomerLoyaltyResponseDto } from './dto/customer-loyalty-response.dto';
import { LoyaltyCardResponseDto } from './dto/loyalty-card-response.dto';
import { LoyaltyProgramResponseDto } from './dto/loyalty-program-response.dto';
import { LoyaltySettingsResponseDto } from './dto/loyalty-settings-response.dto';
import { UpdateLoyaltyProgramDto } from './dto/update-loyalty-program.dto';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  // ─── Cliente ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyLoyalty(@CurrentUser() user: CurrentUserPayload): Promise<
    ApiResponse<{
      settings: LoyaltySettingsResponseDto;
      card: CustomerLoyaltyResponseDto;
      history: CustomerLoyaltyResponseDto['history'];
    }>
  > {
    return this.service.getMyLoyalty(user.id);
  }

  // ─── Legacy: cartões (mantidos para compatibilidade) ───────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('cards')
  async findMyCards(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<LoyaltyCardResponseDto[]>> {
    const cards = await this.service.findMyCards(user.id);
    return { data: cards };
  }

  @UseGuards(JwtAuthGuard)
  @Get('cards/:id')
  async findMyCard(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<ApiResponse<LoyaltyCardResponseDto>> {
    const card = await this.service.findMyCard(user.id, id);
    return { data: card };
  }

  // ─── Legacy: programas (admin) ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('programs')
  async findPrograms(): Promise<ApiResponse<LoyaltyProgramResponseDto[]>> {
    const programs = await this.service.findPrograms();
    return { data: programs };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('programs')
  async createProgram(
    @Body() dto: CreateLoyaltyProgramDto,
  ): Promise<ApiResponse<LoyaltyProgramResponseDto>> {
    const program = await this.service.createProgram(dto);
    return { data: program };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('programs/:id')
  async updateProgram(
    @Param('id') id: string,
    @Body() dto: UpdateLoyaltyProgramDto,
  ): Promise<ApiResponse<LoyaltyProgramResponseDto>> {
    const program = await this.service.updateProgram(id, dto);
    return { data: program };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('programs/:id')
  async removeProgram(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.service.removeProgram(id);
    return { data: { deleted: true } };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('customer/:customerId')
  async findCustomerLoyalty(
    @Param('customerId') customerId: string,
  ): Promise<ApiResponse<LoyaltyCardResponseDto[]>> {
    const cards = await this.service.findCustomerLoyalty(customerId);
    return { data: cards };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('cards/:id/redeem')
  async redeemCard(
    @Param('id') id: string,
  ): Promise<ApiResponse<LoyaltyCardResponseDto>> {
    const card = await this.service.redeemCard(id);
    return { data: card };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('cards/:id/adjust')
  async adjustCard(
    @Param('id') id: string,
    @Body() dto: AdjustLoyaltyCardDto,
  ): Promise<ApiResponse<LoyaltyCardResponseDto>> {
    const card = await this.service.adjustCard(id, dto);
    return { data: card };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('cards/expire-overdue')
  async expireOverdueCards(): Promise<ApiResponse<{ expired: number }>> {
    const result = await this.service.expireOverdueCards();
    return { data: result };
  }
}
