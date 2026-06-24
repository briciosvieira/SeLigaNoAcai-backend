import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PasswordRecoveryService } from './password-recovery.service';

class UpdatePasswordRecoverySettingDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  subjectTemplate?: string;

  @IsOptional()
  @IsString()
  bodyTemplate?: string;
}

class TestEmailDto {
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty()
  email: string;
}

@Controller('admin/password-recovery-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PasswordRecoveryAdminController {
  constructor(private readonly service: PasswordRecoveryService) {}

  @Get()
  async getSettings() {
    return { data: await this.service.getSettings() };
  }

  @Patch()
  async updateSettings(@Body() dto: UpdatePasswordRecoverySettingDto) {
    return { data: await this.service.updateSettings(dto) };
  }

  @Post('test-email')
  @HttpCode(200)
  async testEmail(@Body() dto: TestEmailDto) {
    return { data: await this.service.testEmail(dto.email) };
  }
}
