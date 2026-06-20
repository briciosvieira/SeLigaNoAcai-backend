import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'A zona de entrega é obrigatória.' })
  deliveryZoneId: string;

  @IsOptional()
  @IsString()
  label?: string;

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

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
