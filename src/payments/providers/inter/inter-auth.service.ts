import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { Agent } from 'node:https';
import { resolve } from 'node:path';
import type { InterOAuthTokenResponse } from './inter.types';
import axios, { AxiosError } from 'axios';

@Injectable()
export class InterAuthService {
  private accessToken: string | null = null;
  private expiresAt: number | null = null;
  private readonly httpsAgent: Agent;

  constructor(private readonly configService: ConfigService) {
    this.httpsAgent = this.createHttpsAgent();
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    return this.requestAccessToken();
  }

  getHttpsAgent(): Agent {
    return this.httpsAgent;
  }
  private async requestAccessToken(): Promise<string> {
    const tokenUrl = this.getRequiredEnv('INTER_TOKEN_URL');
    const clientId = this.getRequiredEnv('INTER_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('INTER_CLIENT_SECRET');

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'cob.write cob.read pix.write pix.read webhook.write webhook.read',
    });

    try {
      const response = await axios.post<InterOAuthTokenResponse>(
        tokenUrl,
        body,
        {
          httpsAgent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = response.data;

      this.accessToken = data.access_token;

      const expiresInMs = Math.max(data.expires_in - 60, 60) * 1000;
      this.expiresAt = Date.now() + expiresInMs;

      return this.accessToken;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UnauthorizedException(
          `Falha ao autenticar no Banco Inter: ${error.response?.status ?? 'sem status'} - ${JSON.stringify(error.response?.data ?? error.message)}`,
        );
      }

      throw new InternalServerErrorException(
        'Erro ao solicitar token OAuth do Banco Inter.',
      );
    }
  }

  private createHttpsAgent(): Agent {
    const keyPath = this.getRequiredEnv('INTER_CLIENT_KEY_PATH');
    const certPath = this.getRequiredEnv('INTER_CLIENT_CERT_PATH');
    const caPath = this.configService.get<string>('INTER_CA_PATH');

    const resolvedKeyPath = resolve(process.cwd(), keyPath);
    const resolvedCertPath = resolve(process.cwd(), certPath);
    const resolvedCaPath = caPath ? resolve(process.cwd(), caPath) : null;

    try {
      return new Agent({
        key: readFileSync(resolvedKeyPath),
        cert: readFileSync(resolvedCertPath),
        ca: resolvedCaPath ? readFileSync(resolvedCaPath) : undefined,
        rejectUnauthorized: true,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      console.error('Erro ao carregar certificados do Banco Inter:', {
        keyPath: resolvedKeyPath,
        certPath: resolvedCertPath,
        caPath: resolvedCaPath,
        errorMessage,
      });

      throw new InternalServerErrorException(
        'Não foi possível carregar os certificados do Banco Inter.',
      );
    }
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
}
