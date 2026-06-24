import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthProvider, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

const RATE_LIMIT_SECONDS = 60;

const DEFAULT_SUBJECT = 'Recuperação de senha - Se Liga no Açaí';

const DEFAULT_BODY_TEMPLATE = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fff;">
  <h2 style="color: #7B2D8B; margin-bottom: 16px;">Recuperação de Senha</h2>
  <p>Olá, <strong>{{nome}}</strong>!</p>
  <p>Recebemos uma solicitação de recuperação de senha para a sua conta no <strong>Se Liga no Açaí</strong>.</p>
  <p>Sua senha temporária é:</p>
  <div style="font-size: 22px; font-weight: bold; color: #7B2D8B; background: #f4f4f4; padding: 14px 20px; border-radius: 6px; text-align: center; letter-spacing: 2px; margin: 16px 0;">
    {{senhaTemporaria}}
  </div>
  <p>Use esta senha para fazer login. Após entrar, você será solicitado a criar uma nova senha.</p>
  <p style="color: #888; font-size: 12px; margin-top: 24px;">
    Se você não solicitou a recuperação de senha, ignore este e-mail. Sua conta permanece segura.
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #444;">Atenciosamente,<br><strong>Equipe Se Liga no Açaí</strong></p>
</div>
`;

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    const recentAttempt = await this.prisma.passwordRecoveryAttempt.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_SECONDS * 1000) },
      },
    });

    if (recentAttempt) {
      return;
    }

    await this.prisma.passwordRecoveryAttempt.create({
      data: { email: normalizedEmail },
    });

    const customer = await this.prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !customer ||
      customer.isGuest ||
      !customer.isActive ||
      customer.authProvider !== AuthProvider.MANUAL ||
      customer.role !== UserRole.CUSTOMER
    ) {
      return;
    }

    const tempPassword = this.generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(tempPassword, 10);
    const previousPasswordHash = customer.passwordHash;

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash: tempPasswordHash, mustChangePassword: true },
    });

    const setting = await this.prisma.passwordRecoverySetting.findFirst();

    if (setting && !setting.enabled) {
      return;
    }

    const subject = setting?.subjectTemplate ?? DEFAULT_SUBJECT;
    const bodyTemplate = setting?.bodyTemplate ?? DEFAULT_BODY_TEMPLATE;
    const html = bodyTemplate
      .replace(/\{\{nome\}\}/g, customer.fullName ?? 'Cliente')
      .replace(/\{\{senhaTemporaria\}\}/g, tempPassword);

    try {
      console.log(`[PasswordRecovery] Enviando senha temporária para ${normalizedEmail}`);
      await this.mailService.sendMail({ to: normalizedEmail, subject, html });
      console.log(`[PasswordRecovery] Senha temporária enviada com sucesso para ${normalizedEmail}`);
    } catch (error) {
      console.error(`[PasswordRecovery] Falha no envio — revertendo senha do cliente ${customer.id} | erro: ${(error as Error).message}`);
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { passwordHash: previousPasswordHash, mustChangePassword: false },
      });
    }
  }

  async getSettings() {
    const setting = await this.prisma.passwordRecoverySetting.findFirst();
    return {
      enabled: setting?.enabled ?? true,
      subjectTemplate: setting?.subjectTemplate ?? DEFAULT_SUBJECT,
      bodyTemplate: setting?.bodyTemplate ?? DEFAULT_BODY_TEMPLATE,
    };
  }

  async updateSettings(dto: {
    enabled?: boolean;
    subjectTemplate?: string;
    bodyTemplate?: string;
  }) {
    const existing = await this.prisma.passwordRecoverySetting.findFirst();

    if (existing) {
      return this.prisma.passwordRecoverySetting.update({
        where: { id: existing.id },
        data: {
          ...(dto.enabled !== undefined && { enabled: dto.enabled }),
          ...(dto.subjectTemplate !== undefined && {
            subjectTemplate: dto.subjectTemplate,
          }),
          ...(dto.bodyTemplate !== undefined && {
            bodyTemplate: dto.bodyTemplate,
          }),
        },
      });
    }

    return this.prisma.passwordRecoverySetting.create({
      data: {
        enabled: dto.enabled ?? true,
        subjectTemplate: dto.subjectTemplate ?? null,
        bodyTemplate: dto.bodyTemplate ?? null,
      },
    });
  }

  async testEmail(targetEmail: string) {
    const settings = await this.getSettings();

    const html = settings.bodyTemplate
      .replace(/\{\{nome\}\}/g, 'Teste')
      .replace(/\{\{senhaTemporaria\}\}/g, 'SenhaExemplo@123');

    await this.mailService.sendMail({
      to: targetEmail,
      subject: `[TESTE] ${settings.subjectTemplate}`,
      html,
    });

    return { sent: true };
  }

  private generateTempPassword(): string {
    return crypto.randomBytes(16).toString('base64url').slice(0, 15);
  }
}
