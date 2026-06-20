import { IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateStoreAvailabilityDto {
  @IsBoolean()
  isOpen!: boolean;

  @IsInt()
  @Min(1)
  durationMinutes!: number;
}
