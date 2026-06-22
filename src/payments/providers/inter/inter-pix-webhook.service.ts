import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { InterAuthService } from './inter-auth.service';

type WebhookStatus =
  | 'REGISTERED'
  | 'NOT_REGISTERED'
  | 'CONFIG_ERROR'
  | 'INTER_FORBIDDEN'
  | 'ERROR';

type WebhookResult = {
  success?: boolean;
  expectedWebhookUrl: string | null;
  registeredWebhookUrl?: string | null;
  webhookUrl?: string | null;
  isRegistered?: boolean;
  status: WebhookStatus;
  message: string;
  error?: string;
};

@Injectable()
export class InterPixWebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly interAuthService: InterAuthService,
  ) {}

  // POST /admin/inter/pix/webhook/validate
  validatePixWebhookUrl(): WebhookResult {
    const expectedWebhookUrl = this.configService.get<string>(
      'INTER_PIX_WEBHOOK_URL',
    );

    if (!expectedWebhookUrl) {
      return {
        success: false,
        expectedWebhookUrl: null,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message: 'INTER_PIX_WEBHOOK_URL não configurada no backend.',
      };
    }

    if (!expectedWebhookUrl.startsWith('https://')) {
      return {
        success: false,
        expectedWebhookUrl,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message: 'INTER_PIX_WEBHOOK_URL deve usar HTTPS. O Banco Inter não aceita HTTP.',
      };
    }

    if (
      expectedWebhookUrl.includes('localhost') ||
      expectedWebhookUrl.includes('127.0.0.1') ||
      expectedWebhookUrl.includes('0.0.0.0')
    ) {
      return {
        success: false,
        expectedWebhookUrl,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message:
          'INTER_PIX_WEBHOOK_URL não pode ser localhost. Configure um domínio público acessível pelo Banco Inter.',
      };
    }

    try {
      new URL(expectedWebhookUrl);
    } catch {
      return {
        success: false,
        expectedWebhookUrl,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message: `INTER_PIX_WEBHOOK_URL inválida: "${expectedWebhookUrl}".`,
      };
    }

    return {
      success: true,
      expectedWebhookUrl,
      status: 'REGISTERED',
      message: 'URL do webhook validada com sucesso.',
    };
  }

  // GET /admin/inter/pix/webhook — nunca lança exceção
  async getPixWebhook(): Promise<WebhookResult> {
    const expectedWebhookUrl =
      this.configService.get<string>('INTER_PIX_WEBHOOK_URL') ?? null;

    const pixKey = this.configService.get<string>('INTER_PIX_KEY');

    if (!expectedWebhookUrl || !pixKey) {
      return {
        expectedWebhookUrl,
        registeredWebhookUrl: null,
        webhookUrl: null,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message: !expectedWebhookUrl
          ? 'INTER_PIX_WEBHOOK_URL não configurada no backend.'
          : 'INTER_PIX_KEY não configurada no backend.',
      };
    }

    const webhookApiUrl = this.buildWebhookApiUrl(pixKey);

    try {
      const accessToken = await this.interAuthService.getAccessToken();
      const httpsAgent = this.interAuthService.getHttpsAgent();

      const response = await axios.get<{ webhookUrl?: string }>(webhookApiUrl, {
        httpsAgent,
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15_000,
      });

      const registeredWebhookUrl = response.data?.webhookUrl ?? null;
      const isRegistered =
        registeredWebhookUrl !== null &&
        registeredWebhookUrl === expectedWebhookUrl;

      return {
        expectedWebhookUrl,
        registeredWebhookUrl,
        webhookUrl: registeredWebhookUrl,
        isRegistered,
        status: isRegistered ? 'REGISTERED' : 'NOT_REGISTERED',
        message: isRegistered
          ? 'Webhook cadastrado corretamente.'
          : 'Webhook cadastrado com URL diferente da esperada.',
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        if (status === 404) {
          return {
            expectedWebhookUrl,
            registeredWebhookUrl: null,
            webhookUrl: null,
            isRegistered: false,
            status: 'NOT_REGISTERED',
            message: 'Nenhum webhook cadastrado encontrado.',
          };
        }

        if (status === 403) {
          return {
            expectedWebhookUrl,
            registeredWebhookUrl: null,
            webhookUrl: null,
            isRegistered: false,
            status: 'INTER_FORBIDDEN',
            message:
              'Integração Inter sem escopo necessário para webhook. Verifique webhook.write/webhook.read.',
          };
        }

        return {
          expectedWebhookUrl,
          registeredWebhookUrl: null,
          webhookUrl: null,
          isRegistered: false,
          status: 'ERROR',
          message: 'Não foi possível consultar o webhook no Inter.',
          error: `HTTP ${status ?? 'sem status'} do Banco Inter`,
        };
      }

      return {
        expectedWebhookUrl,
        registeredWebhookUrl: null,
        webhookUrl: null,
        isRegistered: false,
        status: 'ERROR',
        message: 'Não foi possível consultar o webhook no Inter.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // POST /admin/inter/pix/webhook/register
  async registerPixWebhook(): Promise<WebhookResult> {
    const expectedWebhookUrl =
      this.configService.get<string>('INTER_PIX_WEBHOOK_URL') ?? null;

    const pixKey = this.configService.get<string>('INTER_PIX_KEY');

    if (!expectedWebhookUrl) {
      return {
        success: false,
        expectedWebhookUrl: null,
        registeredWebhookUrl: null,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message: 'INTER_PIX_WEBHOOK_URL não configurada no backend.',
      };
    }

    if (!pixKey) {
      return {
        success: false,
        expectedWebhookUrl,
        registeredWebhookUrl: null,
        isRegistered: false,
        status: 'CONFIG_ERROR',
        message: 'INTER_PIX_KEY não configurada no backend.',
      };
    }

    const webhookApiUrl = this.buildWebhookApiUrl(pixKey);

    try {
      const accessToken = await this.interAuthService.getAccessToken();
      const httpsAgent = this.interAuthService.getHttpsAgent();

      await axios.put(
        webhookApiUrl,
        { webhookUrl: expectedWebhookUrl },
        {
          httpsAgent,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15_000,
        },
      );

      // Confirma consultando o Inter após o registro
      const confirm = await this.getPixWebhook();
      const isRegistered = confirm.registeredWebhookUrl === expectedWebhookUrl;

      return {
        success: isRegistered,
        expectedWebhookUrl,
        registeredWebhookUrl: confirm.registeredWebhookUrl ?? null,
        webhookUrl: confirm.registeredWebhookUrl ?? null,
        isRegistered,
        status: isRegistered ? 'REGISTERED' : 'ERROR',
        message: isRegistered
          ? 'Webhook PIX Inter cadastrado com sucesso.'
          : 'Webhook registrado no Inter mas confirmação retornou URL diferente.',
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        if (status === 403) {
          return {
            success: false,
            expectedWebhookUrl,
            registeredWebhookUrl: null,
            isRegistered: false,
            status: 'INTER_FORBIDDEN',
            message:
              'Integração Inter sem escopo necessário para webhook. Verifique webhook.write/webhook.read.',
          };
        }

        return {
          success: false,
          expectedWebhookUrl,
          registeredWebhookUrl: null,
          isRegistered: false,
          status: 'ERROR',
          message: 'Não foi possível cadastrar o webhook no Banco Inter.',
          error: `HTTP ${status ?? 'sem status'} do Banco Inter`,
        };
      }

      return {
        success: false,
        expectedWebhookUrl,
        registeredWebhookUrl: null,
        isRegistered: false,
        status: 'ERROR',
        message: 'Não foi possível cadastrar o webhook no Banco Inter.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private buildWebhookApiUrl(pixKey: string): string {
    const pixCobUrl =
      this.configService.get<string>('INTER_PIX_COB_URL') ?? '';
    const baseV2 = pixCobUrl.replace(/\/cob\/?$/, '');
    return `${baseV2}/webhook/${encodeURIComponent(pixKey)}`;
  }
}
