import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { StoreResponseDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('store')
export class StoreController {
  constructor(private readonly service: StoreService) {}

  @Get('current')
  async findCurrent(): Promise<ApiResponse<StoreResponseDto>> {
    const store = await this.service.findCurrent();
    return { data: store };
  }

  @Post('current')
  async createCurrent(@Body() dto: CreateStoreDto) {
    const store = await this.service.createCurrent(dto);
    return store;
  }

  @Patch('current')
  async updateCurrent(@Body() dto: UpdateStoreDto) {
    const store = await this.service.updateCurrent(dto);
    return store;
  }
}
