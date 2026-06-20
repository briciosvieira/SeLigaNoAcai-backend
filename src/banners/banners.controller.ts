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
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { UpdateBannerStatusDto } from './dto/update-banner-status.dto';

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Get('active')
  async findActive(): Promise<ApiResponse<unknown>> {
    const banners = await this.service.findActive();

    return {
      data: banners,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    const banner = await this.service.findOne(id);

    return {
      data: banner,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    const banners = await this.service.findAll();

    return {
      data: banners,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  async create(@Body() dto: CreateBannerDto): Promise<ApiResponse<unknown>> {
    const banner = await this.service.create(dto);

    return {
      data: banner,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
  ): Promise<ApiResponse<unknown>> {
    const banner = await this.service.update(id, dto);

    return {
      data: banner,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBannerStatusDto,
  ): Promise<ApiResponse<unknown>> {
    const banner = await this.service.updateStatus(id, dto);

    return {
      data: banner,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    const result = await this.service.remove(id);

    return {
      data: result,
    };
  }
}
