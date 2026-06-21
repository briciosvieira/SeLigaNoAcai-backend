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
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/announcements')
export class AnnouncementsAdminController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<AnnouncementResponseDto[]>> {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<AnnouncementResponseDto>> {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateAnnouncementDto): Promise<ApiResponse<AnnouncementResponseDto>> {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ): Promise<ApiResponse<AnnouncementResponseDto>> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.service.remove(id);
  }
}
