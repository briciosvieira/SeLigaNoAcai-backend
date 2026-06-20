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
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PaginationQueryDto } from 'src/commom/dto/pagination-query.dto';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-products.dto';
import { UpdateProductDto } from './dto/update-products.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductOptionGroupResponseDto } from './dto/product-option-group-response.dto';
import { UpdateProductOptionGroupDto } from './dto/update-product-option-group.dto';
import { CreateProductOptionGroupDto } from './dto/create-product-option-group.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.service.findProductMany(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const product = await this.service.findOne(id);
    return { data: product };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.service.create(dto);
    return { data: product };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.service.update(id, dto);
    return { data: product };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }

  @Get(':productId/variants')
  async findVariantsByProduct(
    @Param('productId') productId: string,
  ): Promise<ApiResponse<ProductVariantResponseDto[]>> {
    const variants = await this.service.findVariantsByProduct(productId);

    return {
      data: variants,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':productId/variants')
  async createVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
  ): Promise<ApiResponse<ProductVariantResponseDto>> {
    const variant = await this.service.createVariant(productId, dto);

    return {
      data: variant,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':productId/variants/:variantId')
  async updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ): Promise<ApiResponse<ProductVariantResponseDto>> {
    const variant = await this.service.updateVariant(productId, variantId, dto);

    return {
      data: variant,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':productId/variants/:variantId')
  async removeVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    const result = await this.service.removeVariant(productId, variantId);

    return {
      data: result,
    };
  }

  @Get(':productId/option-groups')
  async findOptionGroupsByProduct(
    @Param('productId') productId: string,
  ): Promise<ApiResponse<ProductOptionGroupResponseDto[]>> {
    const optionGroups =
      await this.service.findOptionGroupsByProduct(productId);

    return {
      data: optionGroups,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':productId/option-groups')
  async createProductOptionGroup(
    @Param('productId') productId: string,
    @Body() dto: CreateProductOptionGroupDto,
  ): Promise<ApiResponse<ProductOptionGroupResponseDto>> {
    const productOptionGroup = await this.service.createProductOptionGroup(
      productId,
      dto,
    );

    return {
      data: productOptionGroup,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':productId/option-groups/:id')
  async updateProductOptionGroup(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductOptionGroupDto,
  ): Promise<ApiResponse<ProductOptionGroupResponseDto>> {
    const productOptionGroup = await this.service.updateProductOptionGroup(
      productId,
      id,
      dto,
    );

    return {
      data: productOptionGroup,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':productId/option-groups/:id')
  async removeProductOptionGroup(
    @Param('productId') productId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.service.removeProductOptionGroup(productId, id);

    return {
      data: {
        deleted: true,
      },
    };
  }
}
