import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'A rua é obrigatória.' })
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'O número é obrigatório.' })
  number: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  referencePoint?: string;
}
