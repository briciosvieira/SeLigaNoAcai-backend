import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import * as QRCode from 'qrcode';
import { InterAuthService } from './inter-auth.service';
import type {
  InterCreatePixChargeRequest,
  InterCreatePixChargeResponse,
  InterGetPixChargeResponse,
  InterPixProviderCreateChargeParams,
  InterPixProviderCreateChargeResult,
  InterPixProviderGetChargeResult,
} from './inter.types';

const PIX_PUT_TIMEOUT_MS = 30_000;
const PIX_GET_TIMEOUT_MS = 15_000;

@Injectable()
export class InterPixService {
  constructor(
    private readonly configService: ConfigService,
    private readonly interAuthService: InterAuthService,
  ) {}

  async createCharge(
    params: InterPixProviderCreateChargeParams,
  ): Promise<InterPixProviderCreateChargeResult> {
    const accessToken = await this.interAuthService.getAccessToken();
    const pixCobUrl = this.getRequiredEnv('INTER_PIX_COB_URL');

    const payload: InterCreatePixChargeRequest = {
      calendario: {
        expiracao: params.expirationSeconds,
      },
      valor: {
        original: params.amount,
      },
      chave: params.pixKey,
      solicitacaoPagador: params.description,
    };

    if (params.payerName && (params.payerCpf || params.payerCnpj)) {
      payload.devedor = {
        nome: params.payerName,
        cpf: params.payerCpf,
        cnpj: params.payerCnpj,
      };
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const httpsAgent = this.interAuthService.getHttpsAgent();

    let data: InterCreatePixChargeResponse;

    try {
      const putResponse = await axios.put<InterCreatePixChargeResponse>(
        `${pixCobUrl}/${params.txid}`,
        payload,
        {
          httpsAgent,
          headers,
          timeout: PIX_PUT_TIMEOUT_MS,
        },
      );

      data = putResponse.data;
    } catch (error) {
      this.handleInterError(error, 'Não foi possível criar a cobrança PIX.');
    }

    // Inter sometimes omits pixCopiaECola from the PUT response.
    // Do a GET to guarantee we have the code before returning.
    if (!data.pixCopiaECola) {
      try {
        const getResponse = await axios.get<InterCreatePixChargeResponse>(
          `${pixCobUrl}/${params.txid}`,
          {
            httpsAgent,
            headers,
            timeout: PIX_GET_TIMEOUT_MS,
          },
        );

        data = getResponse.data;
      } catch (error) {
        this.handleInterError(
          error,
          'Não foi possível recuperar os dados da cobrança PIX.',
        );
      }
    }

    const pixCopyPaste = data.pixCopiaECola ?? null;

    let pixQrCodeBase64: string | null = null;

    if (pixCopyPaste) {
      try {
        pixQrCodeBase64 = await QRCode.toDataURL(pixCopyPaste);
      } catch {
        pixQrCodeBase64 = null;
      }
    }

    return {
      txid: data.txid,
      status: data.status ?? null,
      pixCopyPaste,
      pixQrCode: null,
      pixQrCodeBase64,
      pixExpiresAt: this.calculateExpirationDate(params.expirationSeconds),
      raw: data,
    };
  }

  async getCharge(txid: string): Promise<InterPixProviderGetChargeResult> {
    const accessToken = await this.interAuthService.getAccessToken();
    const pixCobUrl = this.getRequiredEnv('INTER_PIX_COB_URL');

    try {
      const response = await axios.get<InterGetPixChargeResponse>(
        `${pixCobUrl}/${txid}`,
        {
          httpsAgent: this.interAuthService.getHttpsAgent(),
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: PIX_GET_TIMEOUT_MS,
        },
      );

      const data = response.data;
      const paidPix = data.pix?.[0] ?? null;

      return {
        txid: data.txid,
        status: data.status ?? null,
        isPaid: data.status === 'CONCLUIDA',
        paidAt: paidPix?.horario ? new Date(paidPix.horario) : null,
        endToEndId: paidPix?.endToEndId ?? null,
        amountPaid: paidPix?.valor ? Number(paidPix.valor) : null,
        raw: data,
      };
    } catch (error) {
      this.handleInterError(
        error,
        'Não foi possível consultar a cobrança PIX.',
      );
    }
  }

  private calculateExpirationDate(expirationSeconds: number): Date {
    return new Date(Date.now() + expirationSeconds * 1000);
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
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 404) {
        throw new NotFoundException('Cobrança PIX não encontrada no Inter.');
      }

      throw new InternalServerErrorException({
        message: fallbackMessage,
        status,
        interError: data,
      });
    }

    throw new InternalServerErrorException(fallbackMessage);
  }
}
