import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório.' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'O telefone do cliente é obrigatório.' })
  phone: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido.' })
  email?: string;
}
