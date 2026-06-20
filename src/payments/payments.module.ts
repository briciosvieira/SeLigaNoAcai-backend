import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InterAuthService } from './providers/inter/inter-auth.service';
import { InterPixService } from './providers/inter/inter-pix.service';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoyaltyModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    InterAuthService,
    InterPixService,
    ManualPaymentProvider,
  ],
  exports: [PaymentsService, InterPixService, InterAuthService],
})
export class PaymentsModule {}
