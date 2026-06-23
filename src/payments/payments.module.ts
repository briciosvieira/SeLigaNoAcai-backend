import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InterWebhookAdminController } from './inter-webhook-admin.controller';
import { InterPixStatusCheckJob } from './jobs/inter-pix-status-check.job';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PixSyncAdminController } from './pix-sync-admin.controller';
import { PixSyncService } from './pix-sync.service';
import { InterAuthService } from './providers/inter/inter-auth.service';
import { InterPixService } from './providers/inter/inter-pix.service';
import { InterPixWebhookService } from './providers/inter/inter-pix-webhook.service';
import { ManualPaymentProvider } from './providers/manual-payment.provider';

@Module({
  imports: [ConfigModule, PrismaModule, LoyaltyModule],
  controllers: [
    PaymentsController,
    InterWebhookAdminController,
    PixSyncAdminController,
  ],
  providers: [
    PaymentsService,
    InterAuthService,
    InterPixService,
    InterPixWebhookService,
    ManualPaymentProvider,
    PixSyncService,
    InterPixStatusCheckJob,
  ],
  exports: [PaymentsService, InterPixService, InterAuthService, PixSyncService],
})
export class PaymentsModule {}
