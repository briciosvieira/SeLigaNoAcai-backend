import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-products.dto';
import { UpdateProductDto } from './dto/update-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.service.findProductMany(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.service.findOne(id);
    return { data: product };
  }

  @Post()
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.service.create(dto);
    return { data: product };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.service.update(id, dto);
    return { data: product };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
