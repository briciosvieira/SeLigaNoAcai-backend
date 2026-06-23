import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin.service';
import { AdminUsersController } from './admin.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminCustomersController } from './admin-customers.controller';

@Module({
  imports: [PrismaModule],
  providers: [AdminUsersService],
  controllers: [AdminUsersController, AdminCustomersController],
})
export class AdminModule {}
