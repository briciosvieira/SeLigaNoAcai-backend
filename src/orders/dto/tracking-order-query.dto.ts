import { IsNotEmpty, IsString } from 'class-validator';

export class TrackingOrderQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'O telefone é obrigatório.' })
  phone: string;
}
