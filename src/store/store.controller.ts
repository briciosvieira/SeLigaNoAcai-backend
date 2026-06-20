import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { StoreResponseDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { STORE_AVAILABILITY_DURATION_OPTIONS } from './constants/store-availability-duration-options';
import { UpdateStoreAvailabilityDto } from './dto/update-store-availability.dto';

@Controller('store')
export class StoreController {
  constructor(private readonly service: StoreService) {}

  @Get('availability/duration-options')
  getAvailabilityDurationOptions(): ApiResponse<
    typeof STORE_AVAILABILITY_DURATION_OPTIONS
  > {
    return {
      data: STORE_AVAILABILITY_DURATION_OPTIONS,
    };
  }

  @Get('current')
  async findCurrent(): Promise<ApiResponse<any>> {
    const store = await this.service.findCurrent();
    return { data: store };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch('current/availability')
  async updateCurrentStoreAvailability(
    @Body() dto: UpdateStoreAvailabilityDto,
  ): Promise<ApiResponse<any>> {
    console.log(
      'PATCH /store/current/availability chamado com o payload:',
      dto,
    );
    const store = await this.service.updateCurrentStoreAvailability(dto);
    return { data: store };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('current')
  async createCurrent(
    @Body() dto: CreateStoreDto,
  ): Promise<ApiResponse<StoreResponseDto>> {
    const store = await this.service.createCurrent(dto);
    return { data: store };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('current')
  async updateCurrent(
    @Body() dto: UpdateStoreDto,
  ): Promise<ApiResponse<StoreResponseDto>> {
    const store = await this.service.updateCurrent(dto);
    return { data: store };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
