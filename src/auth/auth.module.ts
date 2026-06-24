import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { PasswordRecoveryService } from './password-recovery/password-recovery.service';
import { PasswordRecoveryAdminController } from './password-recovery/password-recovery-admin.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({}),
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, PasswordRecoveryService],
  controllers: [AuthController, PasswordRecoveryAdminController],
  exports: [AuthService],
})
export class AuthModule {}
