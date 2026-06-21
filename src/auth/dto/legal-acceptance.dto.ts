import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LegalAcceptanceDto {
  @IsBoolean()
  termsAccepted: boolean;

  @IsBoolean()
  privacyAccepted: boolean;

  @IsOptional()
  @IsString()
  termsVersion?: string;

  @IsOptional()
  @IsString()
  privacyVersion?: string;
}
