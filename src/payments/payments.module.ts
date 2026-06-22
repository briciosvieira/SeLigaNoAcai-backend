import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InterWebhookAdminController } from './inter-webhook-admin.controller';
import { InterAuthService } from './providers/inter/inter-auth.service';
import { InterPixService } from './providers/inter/inter-pix.service';
import { InterPixWebhookService } from './providers/inter/inter-pix-webhook.service';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoyaltyModule],
  controllers: [PaymentsController, InterWebhookAdminController],
  providers: [
    PaymentsService,
    InterAuthService,
    InterPixService,
    InterPixWebhookService,
    ManualPaymentProvider,
  ],
  exports: [PaymentsService, InterPixService, InterAuthService],
})
export class PaymentsModule {}
