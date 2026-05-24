import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderItemOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID da opção é obrigatório.' })
  optionId: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'A quantidade deve ser no mínimo 1.' })
  quantity?: number;
}
