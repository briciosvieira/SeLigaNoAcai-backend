import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateDeliveryZoneDto {
  @IsString({ message: 'O bairro deve ser um texto.' })
  @IsNotEmpty({ message: 'O bairro é obrigatório.' })
  neighborhood: string;

  @IsString({ message: 'A cidade deve ser um texto.' })
  @IsNotEmpty({ message: 'A cidade é obrigatória.' })
  city: string;

  @IsString({ message: 'O estado deve ser um texto.' })
  @IsNotEmpty({ message: 'O estado é obrigatório.' })
  @Length(2, 2, { message: 'O estado deve ter 2 caracteres.' })
  state: string;

  @IsString({ message: 'A taxa de entrega deve ser um texto.' })
  @IsNotEmpty({ message: 'A taxa de entrega é obrigatória.' })
  deliveryFee: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsUUID('4', { message: 'O ID da loja deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'E necessario selecionar a loja' })
  storeId: string;
}