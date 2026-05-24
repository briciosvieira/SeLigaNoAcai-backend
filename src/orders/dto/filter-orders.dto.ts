import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';

export class FilterOrdersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  orderStatus?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
