import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PixSyncService } from '../pix-sync.service';

@Injectable()
export class InterPixStatusCheckJob {
  constructor(private readonly pixSyncService: PixSyncService) {}

  @Cron('*/30 * * * * *')
  async run(): Promise<void> {
    await this.pixSyncService.processScheduledChecks();
  }
}
