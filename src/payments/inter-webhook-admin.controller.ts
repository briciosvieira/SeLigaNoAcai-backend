import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { InterPixWebhookService } from './providers/inter/inter-pix-webhook.service';

@Controller('admin/inter/pix/webhook')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InterWebhookAdminController {
  constructor(private readonly interPixWebhookService: InterPixWebhookService) {}

  @Post('validate')
  validateUrl() {
    return this.interPixWebhookService.validatePixWebhookUrl();
  }

  @Post('register')
  register() {
    return this.interPixWebhookService.registerPixWebhook();
  }

  @Get()
  getWebhook() {
    return this.interPixWebhookService.getPixWebhook();
  }
}
