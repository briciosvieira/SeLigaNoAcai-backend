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
import { AuthModule } from 'src/auth/auth.module';
import { CustomersModule } from 'src/customers/customers.module';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { AdminModule } from 'src/admin/admin.module';
import { BannersModule } from 'src/banners/banners.module';
import { PromotionsModule } from 'src/promotions/promotions.module';
import { AnnouncementsModule } from 'src/announcements/announcements.module';

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
    AuthModule,
    CustomersModule,
    LoyaltyModule,
    PaymentsModule,
    DashboardModule,
    UploadsModule,
    AdminModule,
    BannersModule,
    PromotionsModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
