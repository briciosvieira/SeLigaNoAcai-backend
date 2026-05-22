import { Module } from '@nestjs/common';
import { DeliveryZonesController } from './delivery-zones.controller';
import { DeliveryZonesService } from './delivery-zones.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveryZonesController],
  providers: [DeliveryZonesService],
})
export class DeliveryZonesModule {}
