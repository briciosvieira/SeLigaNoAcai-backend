import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CustomerLoyaltyResponseDto } from './dto/customer-loyalty-response.dto';
import { LoyaltySettingsResponseDto } from './dto/loyalty-settings-response.dto';
import { StampActionDto } from './dto/stamp-action.dto';
import { UpdateLoyaltySettingsDto } from './dto/update-loyalty-settings.dto';
import { LoyaltyService } from './loyalty.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/loyalty')
export class LoyaltyAdminController {
  constructor(private readonly service: LoyaltyService) {}

  @Get('settings')
  async getSettings(): Promise<ApiResponse<LoyaltySettingsResponseDto>> {
    const settings = await this.service.getSettings();
    return { data: settings };
  }

  @Patch('settings')
  async updateSettings(
    @Body() dto: UpdateLoyaltySettingsDto,
  ): Promise<ApiResponse<LoyaltySettingsResponseDto>> {
    const settings = await this.service.updateSettings(dto);
    return { data: settings };
  }

  @Get('customers')
  async getCustomers(
    @Query('search') search?: string,
  ): Promise<ApiResponse<{ customerId: string; customerName: string | null; stamps: number; availableRewards: number; totalEarnedStamps: number }[]>> {
    return this.service.adminGetCustomers(search);
  }

  @Get('customers/:customerId')
  async getCustomerLoyalty(
    @Param('customerId') customerId: string,
  ): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    return this.service.adminGetCustomerLoyalty(customerId);
  }

  @Post('customers/:customerId/stamps/add')
  async addStamps(
    @Param('customerId') customerId: string,
    @Body() dto: StampActionDto,
  ): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    return this.service.adminAddStamps(customerId, dto);
  }

  @Post('customers/:customerId/stamps/remove')
  async removeStamps(
    @Param('customerId') customerId: string,
    @Body() dto: StampActionDto,
  ): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    return this.service.adminRemoveStamps(customerId, dto);
  }

  @Post('customers/:customerId/rewards/redeem')
  async redeemReward(
    @Param('customerId') customerId: string,
  ): Promise<ApiResponse<CustomerLoyaltyResponseDto>> {
    return this.service.adminRedeemReward(customerId);
  }
}
