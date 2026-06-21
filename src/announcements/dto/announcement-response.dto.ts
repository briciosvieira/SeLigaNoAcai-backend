import type { SiteAnnouncement } from '@prisma/client';

export class AnnouncementResponseDto {
  id: string;
  imageUrl: string;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(a: SiteAnnouncement) {
    this.id = a.id;
    this.imageUrl = a.imageUrl;
    this.startAt = a.startAt;
    this.endAt = a.endAt;
    this.isActive = a.isActive;
    this.createdAt = a.createdAt;
    this.updatedAt = a.updatedAt;
  }
}
