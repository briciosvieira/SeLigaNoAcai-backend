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
import { OptionsService } from './options.service';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { OptionGroupResponseDto } from './dto/option-group-response.dto';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { OptionResponseDto } from './dto/option-response.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Controller('options')
export class OptionsController {
  constructor(private readonly service: OptionsService) {}

  @Get('groups')
  async findManyGroups(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<OptionGroupResponseDto[]>> {
    return this.service.findManyGroups(query);
  }

  @Get('groups/:id')
  async findOneGroup(
    @Param('id') id: string,
  ): Promise<ApiResponse<OptionGroupResponseDto>> {
    const group = await this.service.findOneGroup(id);
    return { data: group };
  }

  @Post('groups')
  async createGroup(
    @Body() dto: CreateOptionGroupDto,
  ): Promise<ApiResponse<OptionGroupResponseDto>> {
    const group = await this.service.createGroup(dto);
    return { data: group };
  }

  @Patch('groups/:id')
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateOptionGroupDto,
  ): Promise<ApiResponse<OptionGroupResponseDto>> {
    const group = await this.service.updateGroup(id, dto);
    return { data: group };
  }

  @Delete('groups/:id')
  @HttpCode(204)
  async removeGroup(@Param('id') id: string): Promise<void> {
    await this.service.removeGroup(id);
  }

  @Post('groups/:groupId/options')
  async createOption(
    @Param('groupId') groupId: string,
    @Body() dto: CreateOptionDto,
  ): Promise<ApiResponse<OptionResponseDto>> {
    const option = await this.service.createOption(groupId, dto);
    return { data: option };
  }

  @Patch(':id')
  async updateOption(
    @Param('id') id: string,
    @Body() dto: UpdateOptionDto,
  ): Promise<ApiResponse<OptionResponseDto>> {
    const option = await this.service.updateOption(id, dto);
    return { data: option };
  }

  @Delete(':id')
  @HttpCode(204)
  async removeOption(@Param('id') id: string): Promise<void> {
    await this.service.removeOption(id);
  }
}
