import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { AdminUsersService } from './admin.service';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { FilterAdminUsersDto } from './dto/filter-admin-users.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateAdminUserPermissionsDto } from './dto/update-admin-user-permissions.dto';
import { UpdateAdminUserRoleDto } from './dto/update-admin-user-role.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  async findAll(@Query() query: FilterAdminUsersDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.findOne(id);
    return { data: user };
  }

  @Post()
  async create(
    @Body() dto: CreateAdminUserDto,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.create(dto);
    return { data: user };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.update(id, dto);
    return { data: user };
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.updateRole(id, dto, currentUser.id);
    return { data: user };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.updateStatus(id, dto, currentUser.id);
    return { data: user };
  }

  @Patch(':id/permissions')
  async updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserPermissionsDto,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.updatePermissions(id, dto);
    return { data: user };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<ApiResponse<AdminUserResponseDto>> {
    const user = await this.service.remove(id, currentUser.id);
    return { data: user };
  }
}
