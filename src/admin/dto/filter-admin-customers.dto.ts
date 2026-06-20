import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';

export class FilterAdminCustomersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
