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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { UpdatePromotionStatusDto } from './dto/update-promotion-status.dto';
import { PromotionsService } from './promotions.service';
import { CalculatePromotionsDto } from './dto/calculate-promotions.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get('active')
  async findActive() {
    const promotions = await this.service.findActive();

    return {
      data: promotions,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get()
  async findAll() {
    const promotions = await this.service.findAll();

    return {
      data: promotions,
    };
  }

  @Get('coupons/availability')
  async hasActiveCouponPromotion() {
    const result = await this.service.hasActiveCouponPromotion();

    return { data: result };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const promotion = await this.service.findOne(id);

    return {
      data: promotion,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  async create(@Body() dto: CreatePromotionDto) {
    const promotion = await this.service.create(dto);

    return {
      data: promotion,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    const promotion = await this.service.update(id, dto);

    return {
      data: promotion,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionStatusDto,
  ) {
    const promotion = await this.service.updateStatus(id, dto);

    return {
      data: promotion,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);

    return {
      data: result,
    };
  }

  @Post('calculate')
  async calculatePromotions(@Body() dto: CalculatePromotionsDto) {
    const result = await this.service.calculatePromotions(dto);

    return {
      data: result,
    };
  }
}
