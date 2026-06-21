import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  fullName: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'O telefone é obrigatório.' })
  phone: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  privacyAccepted?: boolean;

  @IsOptional()
  @IsString()
  termsVersion?: string;

  @IsOptional()
  @IsString()
  privacyVersion?: string;
}
