import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get('active')
  async getActive(): Promise<ApiResponse<AnnouncementResponseDto | null>> {
    return this.service.getActive();
  }
}
