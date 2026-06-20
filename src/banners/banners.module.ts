import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';

@Module({
  imports: [PrismaModule],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
