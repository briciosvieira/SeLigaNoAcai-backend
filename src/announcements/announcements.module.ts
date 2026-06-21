import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AnnouncementsAdminController } from './announcements-admin.controller';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnnouncementsController, AnnouncementsAdminController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
