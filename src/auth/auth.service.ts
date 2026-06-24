import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthProvider, Customer, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDto, AuthUserResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { OAuth2Client } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { LegalAcceptanceDto } from './dto/legal-acceptance.dto';
import { UpdateMeDto } from './dto/update-me.dto';

type TokenPayload = {
  sub: string;
  email?: string;
  role: UserRole;
};

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!googleClientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID não configurado.',
      );
    }

    this.googleClient = new OAuth2Client(googleClientId);
  }

  private readonly googleClient: OAuth2Client;

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    try {
      const googlePayload = await this.verifyGoogleIdToken(dto.idToken);

      const googleId = googlePayload.sub;
      const email = googlePayload.email?.toLowerCase();
      const fullName = googlePayload.name ?? null;

      if (!googleId || !email) {
        throw new UnauthorizedException('Token do Google inválido.');
      }

      if (googlePayload.email_verified === false) {
        throw new UnauthorizedException('E-mail do Google não verificado.');
      }

      const googleAvatar = googlePayload.picture ?? null;

      let existing = await this.prisma.customer.findFirst({
        where: {
          authProvider: AuthProvider.GOOGLE,
          authProviderId: googleId,
        },
      });

      if (!existing) {
        existing = await this.prisma.customer.findUnique({ where: { email } });
      }

      let customer = await this.prisma.$transaction(async (tx) => {
        if (existing) {
          const customerCode =
            existing.customerCode ?? (await this.generateCustomerCode(tx));

          return tx.customer.update({
            where: { id: existing.id },
            data: {
              fullName: existing.fullName ?? fullName,
              email,
              authProvider: AuthProvider.GOOGLE,
              authProviderId: googleId,
              googleAvatarUrl: googleAvatar,
              avatarUrl: existing.avatarUrl ?? googleAvatar,
              customerCode,
              isGuest: false,
              isActive: true,
              lastLoginAt: new Date(),
            },
          });
        }

        const customerCode = await this.generateCustomerCode(tx);

        return tx.customer.create({
          data: {
            fullName,
            email,
            authProvider: AuthProvider.GOOGLE,
            authProviderId: googleId,
            googleAvatarUrl: googleAvatar,
            avatarUrl: googleAvatar,
            customerCode,
            role: UserRole.CUSTOMER,
            isGuest: false,
            isActive: true,
            lastLoginAt: new Date(),
          },
        });
      });

      const tokens = await this.generateTokens(customer);

      await this.saveRefreshToken(customer.id, tokens.refreshToken);

      return new AuthResponseDto(
        customer,
        tokens.accessToken,
        tokens.refreshToken,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Não foi possível autenticar com Google.',
      );
    }
  }

  private async verifyGoogleIdToken(idToken: string) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!googleClientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID não configurado.',
      );
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Token do Google inválido.');
    }

    return payload;
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const cpf = dto.cpf;

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: [{ email }, ...(cpf ? [{ cpf }] : [])],
      },
    });

    if (existingCustomer && !existingCustomer.isGuest) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail ou CPF.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let customer: Customer;

    try {
      customer = await this.prisma.$transaction(async (tx) => {
        const customerCode =
          existingCustomer?.customerCode ??
          (await this.generateCustomerCode(tx));

        if (existingCustomer && existingCustomer.isGuest) {
          const now = new Date();
        const legalData = {
          ...(dto.termsAccepted && { termsAcceptedAt: now, termsVersion: dto.termsVersion ?? null }),
          ...(dto.privacyAccepted && { privacyAcceptedAt: now, privacyVersion: dto.privacyVersion ?? null }),
        };

        return tx.customer.update({
            where: {
              id: existingCustomer.id,
            },
            data: {
              fullName: dto.fullName,
              email,
              phone: dto.phone,
              cpf: dto.cpf,
              passwordHash,
              authProvider: AuthProvider.MANUAL,
              authProviderId: email,
              role: UserRole.CUSTOMER,
              customerCode,
              isGuest: false,
              isActive: true,
              lastLoginAt: new Date(),
              ...legalData,
            },
          });
        }

        const now = new Date();
        const legalData = {
          ...(dto.termsAccepted && { termsAcceptedAt: now, termsVersion: dto.termsVersion ?? null }),
          ...(dto.privacyAccepted && { privacyAcceptedAt: now, privacyVersion: dto.privacyVersion ?? null }),
        };

        return tx.customer.create({
          data: {
            fullName: dto.fullName,
            email,
            phone: dto.phone,
            cpf: dto.cpf,
            passwordHash,
            authProvider: AuthProvider.MANUAL,
            authProviderId: email,
            role: UserRole.CUSTOMER,
            customerCode,
            isGuest: false,
            isActive: true,
            lastLoginAt: new Date(),
            ...legalData,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma conta cadastrada com este e-mail ou CPF.',
        );
      }
      throw error;
    }

    const tokens = await this.generateTokens(customer);

    await this.saveRefreshToken(customer.id, tokens.refreshToken);

    return new AuthResponseDto(
      customer,
      tokens.accessToken,
      tokens.refreshToken,
    );
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();

    try {
      const customer = await this.prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        throw new UnauthorizedException('E-mail não cadastrado.');
      }

      if (!customer.passwordHash) {
        throw new UnauthorizedException(
          'Esta conta não possui senha configurada.',
        );
      }

      if (!customer.isActive) {
        throw new UnauthorizedException(
          'Usuário inativo. Entre em contato com o suporte.',
        );
      }

      const passwordMatches = await bcrypt.compare(
        dto.password,
        customer.passwordHash,
      );

      if (!passwordMatches) {
        throw new UnauthorizedException('Senha incorreta.');
      }

      const updatedCustomer = await this.prisma.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      });

      const tokens = await this.generateTokens(updatedCustomer);

      await this.saveRefreshToken(updatedCustomer.id, tokens.refreshToken);

      return new AuthResponseDto(
        updatedCustomer,
        tokens.accessToken,
        tokens.refreshToken,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'O sistema está temporariamente indisponível. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET');

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET não configurado.');
    }

    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(
        dto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    try {
      const customer = await this.prisma.customer.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!customer) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      if (!customer.isActive) {
        throw new UnauthorizedException(
          'Usuário inativo. Entre em contato com o suporte.',
        );
      }

      if (!customer.refreshTokenHash) {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      const refreshMatches = await bcrypt.compare(
        dto.refreshToken,
        customer.refreshTokenHash,
      );

      if (!refreshMatches) {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      const tokens = await this.generateTokens(customer);

      await this.saveRefreshToken(customer.id, tokens.refreshToken);

      return new AuthResponseDto(
        customer,
        tokens.accessToken,
        tokens.refreshToken,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'O sistema está temporariamente indisponível. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async logout(customerId: string): Promise<{ loggedOut: boolean }> {
    await this.prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        refreshTokenHash: null,
      },
    });

    return {
      loggedOut: true,
    };
  }

  async me(customerId: string): Promise<AuthUserResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo.');
    }

    return new AuthUserResponseDto(customer);
  }

  private normalizeExpiresIn(
    value: string | undefined,
    fallback: JwtExpiresIn,
    defaultUnit: 'm' | 'd',
  ): JwtExpiresIn {
    if (!value) {
      return fallback;
    }

    if (/^\d+$/.test(value)) {
      return `${value}${defaultUnit}` as JwtExpiresIn;
    }

    return value as JwtExpiresIn;
  }

  private async generateTokens(customer: Customer): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: TokenPayload = {
      sub: customer.id,
      email: customer.email ?? undefined,
      role: customer.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? jwtSecret;

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT_SECRET ou JWT_REFRESH_SECRET não configurado.');
    }

    const jwtExpiresIn = this.normalizeExpiresIn(
      this.configService.get<string>('JWT_EXPIRES_IN'),
      '15m',
      'm',
    );

    const refreshExpiresIn = this.normalizeExpiresIn(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      '7d',
      'd',
    );

    const accessTokenOptions: JwtSignOptions = {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessTokenOptions),
      this.jwtService.signAsync(payload, refreshTokenOptions),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(
    customerId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        refreshTokenHash,
      },
    });
  }

  private async generateCustomerCode(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const result = await tx.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('customer_code_seq')::bigint AS nextval
    `;

    const nextValue = Number(result[0].nextval);

    return String(nextValue).padStart(7, '0');
  }

  async updateMe(
    customerId: string,
    dto: UpdateMeDto,
  ): Promise<AuthUserResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo.');
    }

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    return new AuthUserResponseDto(updated);
  }

  async acceptLegal(
    customerId: string,
    dto: LegalAcceptanceDto,
  ): Promise<AuthUserResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo.');
    }

    const now = new Date();

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(dto.termsAccepted && !customer.termsAcceptedAt && { termsAcceptedAt: now, termsVersion: dto.termsVersion ?? null }),
        ...(dto.privacyAccepted && !customer.privacyAcceptedAt && { privacyAcceptedAt: now, privacyVersion: dto.privacyVersion ?? null }),
      },
    });

    return new AuthUserResponseDto(updated);
  }

  async changeMyPassword(
    customerId: string,
    dto: ChangeMyPasswordDto,
  ): Promise<{ updated: boolean }> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new ForbiddenException('Usuário inválido.');
    }

    if (customer.authProvider !== AuthProvider.MANUAL) {
      throw new BadRequestException(
        'Sua conta utiliza login com Google. A senha é gerenciada pelo Google.',
      );
    }

    if (!customer.passwordHash) {
      throw new BadRequestException(
        'Este usuário ainda não possui senha manual cadastrada.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      customer.passwordHash,
    );

    if (!passwordMatches) {
      throw new BadRequestException('Senha atual inválida.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        passwordHash: newPasswordHash,
        refreshTokenHash: null,
        mustChangePassword: false,
      },
    });

    return {
      updated: true,
    };
  }
}
