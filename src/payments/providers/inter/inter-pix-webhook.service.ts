import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { InterAuthService } from './inter-auth.service';

type RegisterResult = {
  success: boolean;
  message: string;
  webhookUrl: string;
};

type GetResult = {
  webhookUrl: string | null;
  message?: string;
};

@Injectable()
export class InterPixWebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly interAuthService: InterAuthService,
  ) {}

  validatePixWebhookUrl(): { success: boolean; message: string; webhookUrl: string } {
    const webhookUrl = this.getRequiredEnv('INTER_PIX_WEBHOOK_URL');

    if (!webhookUrl.startsWith('https://')) {
      throw new BadRequestException(
        'INTER_PIX_WEBHOOK_URL deve usar HTTPS. O Banco Inter não aceita HTTP.',
      );
    }

    if (
      webhookUrl.includes('localhost') ||
      webhookUrl.includes('127.0.0.1') ||
      webhookUrl.includes('0.0.0.0')
    ) {
      throw new BadRequestException(
        'INTER_PIX_WEBHOOK_URL não pode ser localhost. Configure um domínio público acessível pelo Banco Inter.',
      );
    }

    try {
      new URL(webhookUrl);
    } catch {
      throw new BadRequestException(
        `INTER_PIX_WEBHOOK_URL inválida: "${webhookUrl}".`,
      );
    }

    return {
      success: true,
      message: 'URL do webhook validada com sucesso. Pronta para cadastro no Banco Inter.',
      webhookUrl,
    };
  }

  async registerPixWebhook(): Promise<RegisterResult> {
    const webhookUrl = this.getRequiredEnv('INTER_PIX_WEBHOOK_URL');
    const pixKey = this.getRequiredEnv('INTER_PIX_KEY');
    const webhookApiUrl = this.buildWebhookApiUrl(pixKey);

    const accessToken = await this.interAuthService.getAccessToken();
    const httpsAgent = this.interAuthService.getHttpsAgent();

    try {
      await axios.put(
        webhookApiUrl,
        { webhookUrl },
        {
          httpsAgent,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15_000,
        },
      );

      return {
        success: true,
        message: 'Webhook Pix Inter cadastrado com sucesso.',
        webhookUrl,
      };
    } catch (error) {
      this.handleInterError(
        error,
        'Não foi possível cadastrar o webhook no Banco Inter.',
      );
    }
  }

  async getPixWebhook(): Promise<GetResult> {
    const pixKey = this.getRequiredEnv('INTER_PIX_KEY');
    const webhookApiUrl = this.buildWebhookApiUrl(pixKey);

    const accessToken = await this.interAuthService.getAccessToken();
    const httpsAgent = this.interAuthService.getHttpsAgent();

    try {
      const response = await axios.get<{ webhookUrl?: string }>(
        webhookApiUrl,
        {
          httpsAgent,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 15_000,
        },
      );

      return {
        webhookUrl: response.data?.webhookUrl ?? null,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return {
          webhookUrl: null,
          message: 'Nenhum webhook cadastrado encontrado.',
        };
      }

      this.handleInterError(
        error,
        'Não foi possível consultar o webhook no Banco Inter.',
      );
    }
  }

  private buildWebhookApiUrl(pixKey: string): string {
    const pixCobUrl = this.getRequiredEnv('INTER_PIX_COB_URL');
    const baseV2 = pixCobUrl.replace(/\/cob\/?$/, '');
    return `${baseV2}/webhook/${encodeURIComponent(pixKey)}`;
  }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(
        `Variável de ambiente ${key} não configurada.`,
      );
    }

    return value;
  }

  private handleInterError(error: unknown, fallbackMessage: string): never {
    if (error instanceof AxiosError) {
      throw new InternalServerErrorException({
        message: fallbackMessage,
        httpStatus: error.response?.status,
        interError: error.response?.data,
      });
    }

    throw new InternalServerErrorException(fallbackMessage);
  }
}
