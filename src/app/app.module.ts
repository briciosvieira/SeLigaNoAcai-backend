import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StoreModule } from 'src/store/store.module';
import { ConfigModule } from '@nestjs/config';
import { DeliveryZonesModule } from 'src/delivery-zones/delivery-zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    StoreModule,
    DeliveryZonesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
