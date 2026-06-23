import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(): Promise<ApiResponse<AnnouncementResponseDto | null>> {
    const now = new Date();
    const announcement = await this.prisma.siteAnnouncement.findFirst({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: announcement ? new AnnouncementResponseDto(announcement) : null,
    };
  }

  async findAll(): Promise<ApiResponse<AnnouncementResponseDto[]>> {
    const announcements = await this.prisma.siteAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: announcements.map((a) => new AnnouncementResponseDto(a)) };
  }

  async findOne(id: string): Promise<ApiResponse<AnnouncementResponseDto>> {
    const announcement = await this.prisma.siteAnnouncement.findUnique({
      where: { id },
    });
    if (!announcement)
      throw new NotFoundException('Informativo não encontrado.');
    return { data: new AnnouncementResponseDto(announcement) };
  }

  async create(
    dto: CreateAnnouncementDto,
  ): Promise<ApiResponse<AnnouncementResponseDto>> {
    try {
      const announcement = await this.prisma.siteAnnouncement.create({
        data: {
          imageUrl: dto.imageUrl,
          startAt: dto.startAt,
          endAt: dto.endAt,
          isActive: dto.isActive ?? true,
        },
      });
      return { data: new AnnouncementResponseDto(announcement) };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Não foi possível criar o informativo.',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateAnnouncementDto,
  ): Promise<ApiResponse<AnnouncementResponseDto>> {
    try {
      const existing = await this.prisma.siteAnnouncement.findUnique({
        where: { id },
      });
      if (!existing) throw new NotFoundException('Informativo não encontrado.');

      const announcement = await this.prisma.siteAnnouncement.update({
        where: { id },
        data: {
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.startAt !== undefined && { startAt: dto.startAt }),
          ...(dto.endAt !== undefined && { endAt: dto.endAt }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
      return { data: new AnnouncementResponseDto(announcement) };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Não foi possível atualizar o informativo.',
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const existing = await this.prisma.siteAnnouncement.findUnique({
        where: { id },
      });
      if (!existing) throw new NotFoundException('Informativo não encontrado.');
      await this.prisma.siteAnnouncement.delete({ where: { id } });
      return { data: { deleted: true } };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Não foi possível remover o informativo.',
      );
    }
  }
}
