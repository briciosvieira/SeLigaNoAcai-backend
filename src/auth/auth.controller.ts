import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthResponseDto, AuthUserResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPayload } from './decorators/current-user.decorator';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { LegalAcceptanceDto } from './dto/legal-acceptance.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const auth = await this.service.register(dto);

    return {
      data: auth,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponseDto>> {
    const auth = await this.service.login(dto);

    return {
      data: auth,
    };
  }

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const auth = await this.service.googleLogin(dto);

    return {
      data: auth,
    };
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const auth = await this.service.refresh(dto);

    return {
      data: auth,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<{ loggedOut: boolean }>> {
    const result = await this.service.logout(user.id);

    return {
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<AuthUserResponseDto>> {
    const customer = await this.service.me(user.id);

    return {
      data: customer,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMeDto,
  ): Promise<ApiResponse<AuthUserResponseDto>> {
    const customer = await this.service.updateMe(user.id, dto);

    return {
      data: customer,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/legal-acceptance')
  async acceptLegal(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: LegalAcceptanceDto,
  ): Promise<ApiResponse<AuthUserResponseDto>> {
    const customer = await this.service.acceptLegal(user.id, dto);

    return {
      data: customer,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changeMyPassword(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: ChangeMyPasswordDto,
  ): Promise<ApiResponse<{ updated: boolean }>> {
    const result = await this.service.changeMyPassword(currentUser.id, dto);

    return {
      data: result,
    };
  }
}
