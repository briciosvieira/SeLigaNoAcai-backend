import {
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PixSyncService } from './pix-sync.service';

@Controller('admin/payments/pix/inter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PixSyncAdminController {
  constructor(private readonly pixSyncService: PixSyncService) {}

  // Sincroniza todos os PIX pendentes das últimas 3 horas
  @Post('sync-pending')
  @HttpCode(200)
  syncPending() {
    return this.pixSyncService.syncRecentPendingPayments(3);
  }

  // Sincroniza um pagamento específico por paymentId
  @Post('sync/:paymentId')
  @HttpCode(200)
  syncOne(@Param('paymentId') paymentId: string) {
    return this.pixSyncService.syncPayment(paymentId);
  }
}
