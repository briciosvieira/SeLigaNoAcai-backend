import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private createTransport() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT') ?? 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const transporter = this.createTransport();
    const fromName =
      this.configService.get<string>('SMTP_FROM_NAME') ?? 'Se Liga no Açaí';
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL');

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[MailService] E-mail enviado para ${options.to} | messageId: ${info.messageId}`);
    } catch (error) {
      console.error(`[MailService] Falha ao enviar e-mail para ${options.to} | erro: ${(error as Error).message}`);
      throw error;
    }
  }
}
