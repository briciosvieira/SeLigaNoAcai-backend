export type InterOAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
};

export type InterPixDebtor = {
  cpf?: string;
  cnpj?: string;
  nome: string;
};

export type InterPixAdditionalInfo = {
  nome: string;
  valor: string;
};

export type InterCreatePixChargeRequest = {
  calendario: {
    expiracao: number;
  };
  devedor?: InterPixDebtor;
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador?: string;
  infoAdicionais?: InterPixAdditionalInfo[];
};

export type InterPixLocation = {
  id?: number;
  location?: string;
  tipoCob?: string;
  criacao?: string;
};

export type InterPixChargeStatus =
  | 'ATIVA'
  | 'CONCLUIDA'
  | 'REMOVIDA_PELO_USUARIO_RECEBEDOR'
  | 'REMOVIDA_PELO_PSP';

export type InterCreatePixChargeResponse = {
  calendario?: {
    criacao?: string;
    expiracao?: number;
  };
  txid: string;
  revisao?: number;
  loc?: InterPixLocation;
  location?: string;
  status?: InterPixChargeStatus;
  devedor?: InterPixDebtor;
  valor?: {
    original?: string;
  };
  chave?: string;
  solicitacaoPagador?: string;
  pixCopiaECola?: string;
};

export type InterGetPixChargeResponse = InterCreatePixChargeResponse & {
  pix?: InterPixWebhookPayment[];
};

export type InterPixWebhookPayment = {
  endToEndId?: string;
  txid?: string;
  valor?: string;
  horario?: string;
  infoPagador?: string;
  pagador?: {
    nome?: string;
    cpf?: string;
    cnpj?: string;
    instituicao?: string;
  };
  devolucoes?: unknown[];
};

export type InterPixWebhookPayload = {
  pix?: InterPixWebhookPayment[];
};

export type InterPixProviderCreateChargeParams = {
  txid: string;
  amount: string;
  pixKey: string;
  expirationSeconds: number;
  payerName?: string;
  payerCpf?: string;
  payerCnpj?: string;
  description?: string;
};

export type InterPixProviderCreateChargeResult = {
  txid: string;
  status: InterPixChargeStatus | null;
  pixCopyPaste: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: Date | null;
  raw: InterCreatePixChargeResponse;
};

export type InterPixProviderGetChargeResult = {
  txid: string;
  status: InterPixChargeStatus | null;
  isPaid: boolean;
  paidAt: Date | null;
  endToEndId: string | null;
  amountPaid: number | null;
  payerName: string | null;
  payerDocument: string | null;
  payerBank: string | null;
  raw: InterGetPixChargeResponse;
};

export type InterListReceivedPixResponse = {
  pix?: InterPixWebhookPayment[];
  parametros?: {
    inicio: string;
    fim: string;
    paginacao?: {
      paginaAtual: number;
      itensPorPagina: number;
      quantidadeDePaginas: number;
      quantidadeTotalDeItens: number;
    };
  };
};
