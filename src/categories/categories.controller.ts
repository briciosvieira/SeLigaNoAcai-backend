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
import { CategoriesService } from './categories.service';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { CategoriesRespondeDto } from './dto/category-response.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category-dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  async findMany(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<CategoriesRespondeDto[]>> {
    return this.service.findMany(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoriesRespondeDto> {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto): Promise<CategoriesRespondeDto> {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoriesRespondeDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
