import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StoreModule } from 'src/store/store.module';
import { ConfigModule } from '@nestjs/config';
import { DeliveryZonesModule } from 'src/delivery-zones/delivery-zones.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { ProductsModule } from 'src/products/products.module';
import { OptionsModule } from 'src/options/options.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    StoreModule,
    DeliveryZonesModule,
    CategoriesModule,
    ProductsModule,
    OptionsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
