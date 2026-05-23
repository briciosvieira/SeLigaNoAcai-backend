import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { DeliveryZonesService } from './delivery-zones.service';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { DeliveryZonesResponseDto } from './dto/delivery-zones-response';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';

@Controller('delivery-zones')
export class DeliveryZonesController {
  constructor(private readonly service: DeliveryZonesService) {}

  @Get()
  async findDeliveryZone(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<DeliveryZonesResponseDto[]>> {
    return this.service.findManyZone(query);
  }

  @Get(':id')
  async findOneDeliveryZone(
    @Param('id') id: string,
  ): Promise<ApiResponse<DeliveryZonesResponseDto>> {
    const zone = await this.service.findOneZone(id);
    return { data: zone };
  }

  @Post()
  async create(
    @Body() createDeliveryZoneDto: CreateDeliveryZoneDto,
  ): Promise<ApiResponse<DeliveryZonesResponseDto>> {
    const zone = await this.service.create(createDeliveryZoneDto);
    return { data: zone };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDeliveryZoneDto: UpdateDeliveryZoneDto,
  ): Promise<ApiResponse<DeliveryZonesResponseDto>> {
    const zone = await this.service.update(id, updateDeliveryZoneDto);
    return { data: zone };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
