import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOrderAddressDto } from './create-order-address.dto';
import { CreateOrderCustomerDto } from './create-order-customer.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CreateOrderCustomerDto)
  @IsNotEmpty({ message: 'Os dados do cliente são obrigatórios.' })
  customer: CreateOrderCustomerDto;

  @ValidateNested()
  @Type(() => CreateOrderAddressDto)
  @IsNotEmpty({ message: 'O endereço de entrega é obrigatório.' })
  address: CreateOrderAddressDto;

  @IsString()
  @IsNotEmpty({ message: 'A zona de entrega é obrigatória.' })
  deliveryZoneId: string;

  @ArrayNotEmpty({ message: 'O pedido deve conter pelo menos um item.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  changeForAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
