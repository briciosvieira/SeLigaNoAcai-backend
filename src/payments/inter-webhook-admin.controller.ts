import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { InterPixWebhookService } from './providers/inter/inter-pix-webhook.service';

@Controller('admin/inter/pix/webhook')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InterWebhookAdminController {
  constructor(
    private readonly interPixWebhookService: InterPixWebhookService,
  ) {}

  @Get()
  async getWebhook() {
    return this.interPixWebhookService.getPixWebhook();
  }

  @Post('validate')
  @HttpCode(200)
  validateWebhook() {
    return this.interPixWebhookService.validatePixWebhookUrl();
  }

  @Post('register')
  @HttpCode(200)
  async registerWebhook() {
    return this.interPixWebhookService.registerPixWebhook();
  }
}
