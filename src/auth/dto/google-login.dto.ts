import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O token do Google é obrigatório.' })
  idToken!: string;
}
